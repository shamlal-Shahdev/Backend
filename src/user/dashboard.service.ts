import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletBalanceEntity } from '../wallet-balance/entity/wallet-balance.entity';
import { CertificateEntity } from '../certificate/entity/certificate.entity';
import {
  RewardReason,
  RewardTransactionEntity,
} from '../reward-transaction/entity/reward-transaction.entity';
import { PredictionEntity, PredictionStatus } from '../prediction/entity/prediction.entity';
import { InstallationEntity } from '../installation/entity/installation.entity';
import { DashboardResponseDto } from './dto/dashboard-response.dto';
import { UserCarbonMetricsService } from './user-carbon-metrics.service';
import { CertificateService } from '../certificate/certificate.service';
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(WalletBalanceEntity)
    private readonly walletBalanceRepository: Repository<WalletBalanceEntity>,
    @InjectRepository(CertificateEntity)
    private readonly certificateRepository: Repository<CertificateEntity>,
    @InjectRepository(RewardTransactionEntity)
    private readonly rewardTransactionRepository: Repository<RewardTransactionEntity>,
    @InjectRepository(PredictionEntity)
    private readonly predictionRepository: Repository<PredictionEntity>,
    @InjectRepository(InstallationEntity)
    private readonly installationRepository: Repository<InstallationEntity>,
    private readonly userCarbonMetricsService: UserCarbonMetricsService,
    private readonly certificateService: CertificateService,
  ) {}
  async getUserDashboard(userId: number): Promise<DashboardResponseDto> {
    const totalEnergyResult = await this.rewardTransactionRepository
      .createQueryBuilder('rt')
      .select('COALESCE(SUM(rt.kwh_rewarded), 0)', 'total')
      .where('rt.user_id = :userId', { userId })
      .andWhere('rt.reason = :reason', {
        reason: RewardReason.VENDOR_MONTHLY_USAGE,
      })
      .getRawOne();
    const totalEnergyGenerated = parseFloat(totalEnergyResult?.total || '0');
    const walletBalance = await this.walletBalanceRepository.findOne({
      where: { userId },
    });
    const tokensAvailable = walletBalance ? parseFloat(walletBalance.balance.toString()) : 0;
    const totalTokensResult = await this.rewardTransactionRepository
      .createQueryBuilder('rt')
      .select('COALESCE(SUM(rt.tokens_amount), 0)', 'total')
      .where('rt.user_id = :userId', { userId })
      .getRawOne();
    const totalTokensEarned = parseFloat(totalTokensResult?.total || '0');
    const tokensRedeemed = 0;
    const certificatesEarned = await this.certificateRepository.count({
      where: { userId },
    });
    const activePredictions = await this.predictionRepository.count({
      where: { userId, status: PredictionStatus.LOCKED },
    });
    const monthlyRewardRows = await this.rewardTransactionRepository
      .createQueryBuilder('rt')
      .select('rt.usage_period_year_month', 'month')
      .addSelect('COALESCE(SUM(rt.kwh_rewarded), 0)', 'kwh')
      .where('rt.user_id = :userId', { userId })
      .andWhere('rt.reason = :reason', { reason: RewardReason.VENDOR_MONTHLY_USAGE })
      .andWhere('rt.usage_period_year_month IS NOT NULL')
      .groupBy('rt.usage_period_year_month')
      .getRawMany<{ month: string; kwh: string }>();

    const monthlyKwhByRewardPeriod = new Map<string, number>();
    monthlyRewardRows.forEach((row) => {
      const safeMonth = typeof row.month === 'string' ? row.month : '';
      const safeKwh = Number.isFinite(parseFloat(row.kwh)) ? parseFloat(row.kwh) : 0;
      if (!safeMonth) {
        return;
      }
      monthlyKwhByRewardPeriod.set(safeMonth, Math.max(safeKwh, 0));
    });

    const energyTrend: { month: string; energy: number }[] = [];
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      energyTrend.push({
        month: monthStr,
        energy: monthlyKwhByRewardPeriod.get(monthStr) || 0,
      });
    }
    const carbonReductionTrend = this.userCarbonMetricsService.calculateMonthlyCarbonTrend(
      energyTrend.map((item) => ({
        month: item.month,
        kwh: item.energy,
      })),
    );
    const monthlyCarbonReducedKg =
      this.userCarbonMetricsService.getCurrentMonthCarbonReducedKg(carbonReductionTrend);
    const totalCarbonReducedKg = this.userCarbonMetricsService.getTotalCarbonReducedKg(carbonReductionTrend);
    const rewardsByCategory = await this.rewardTransactionRepository
      .createQueryBuilder('rt')
      .select('rt.reason', 'category')
      .addSelect('COALESCE(SUM(rt.tokens_amount), 0)', 'amount')
      .where('rt.user_id = :userId', { userId })
      .groupBy('rt.reason')
      .getRawMany();
    const rewardsDistribution = rewardsByCategory.map((item) => {
      const amount = parseFloat(item.amount);
      const percentage = totalTokensEarned > 0 ? (amount / totalTokensEarned) * 100 : 0;
      return {
        category: item.category,
        amount,
        percentage: Math.round(percentage * 10) / 10, 
      };
    });
    const recentRewards = await this.rewardTransactionRepository.find({
      where: { userId },
      order: { issuedAt: 'DESC' },
      take: 10,
      relations: ['installation'],
    });
    const recentCertificates = await this.certificateRepository.find({
      where: { userId },
      order: { generatedAt: 'DESC' },
      take: 5,
    });
    const allActivities: Array<{
      type: string;
      description: string;
      date: Date;
      amount?: number;
    }> = [];
    recentRewards.forEach((reward) => {
      allActivities.push({
        type: 'tokens',
        description: `Earned ${parseFloat(reward.tokensAmount.toString()).toFixed(2)} WATT from ${parseFloat(reward.kwhRewarded.toString()).toFixed(2)} kWh`,
        date: reward.issuedAt,
        amount: parseFloat(reward.tokensAmount.toString()),
      });
    });
    recentCertificates.forEach((cert) => {
      allActivities.push({
        type: 'certificate',
        description: `Certificate generated for ${cert.month}/${cert.year} - ${parseFloat(cert.totalKwh.toString()).toFixed(2)} kWh`,
        date: cert.generatedAt,
      });
    });
    const recentActivity = allActivities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    const latestCertificate = await this.certificateService.getLatestForUser(userId);
    return {
      totalEnergyGenerated,
      totalTokensEarned,
      tokensRedeemed,
      tokensAvailable,
      activePredictions,
      certificatesEarned,
      monthlyCarbonReducedKg,
      totalCarbonReducedKg,
      energyGenerationTrend: energyTrend,
      carbonReductionTrend,
      rewardsDistribution,
      recentActivity,
      latestCertificate,
    };
  }
}
