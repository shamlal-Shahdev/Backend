import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnergyReadingEntity } from '../energy-reading/entity/energy-reading.entity';
import { WalletBalanceEntity } from '../wallet-balance/entity/wallet-balance.entity';
import { CertificateEntity } from '../certificate/entity/certificate.entity';
import { RewardTransactionEntity } from '../reward-transaction/entity/reward-transaction.entity';
import { PredictionEntity, PredictionStatus } from '../prediction/entity/prediction.entity';
import { InstallationEntity } from '../installation/entity/installation.entity';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(EnergyReadingEntity)
    private readonly energyReadingRepository: Repository<EnergyReadingEntity>,
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
  ) {}

  async getUserDashboard(userId: number): Promise<DashboardResponseDto> {
    // Get user's installations
    const installations = await this.installationRepository.find({
      where: { userId },
      select: ['id'],
    });
    const installationIds = installations.map((inst) => inst.id);

    // Calculate total energy generated (sum of verified_kwh from energy_readings)
    const totalEnergyResult = await this.energyReadingRepository
      .createQueryBuilder('er')
      .select('COALESCE(SUM(er.verified_kwh), 0)', 'total')
      .where('er.installation_id IN (:...ids)', { ids: installationIds.length > 0 ? installationIds : [-1] })
      .andWhere('er.verified = :verified', { verified: true })
      .getRawOne();
    const totalEnergyGenerated = parseFloat(totalEnergyResult?.total || '0');

    // Get wallet balance
    const walletBalance = await this.walletBalanceRepository.findOne({
      where: { userId },
    });
    const tokensAvailable = walletBalance ? parseFloat(walletBalance.balance.toString()) : 0;

    // Calculate total tokens earned (sum of tokens_amount from reward_transactions)
    const totalTokensResult = await this.rewardTransactionRepository
      .createQueryBuilder('rt')
      .select('COALESCE(SUM(rt.tokens_amount), 0)', 'total')
      .where('rt.user_id = :userId', { userId })
      .getRawOne();
    const totalTokensEarned = parseFloat(totalTokensResult?.total || '0');

    // Calculate tokens redeemed (for now, we'll use 0 as redemption tracking might be separate)
    // This could be calculated from redemption table if it exists
    const tokensRedeemed = 0;

    // Count certificates earned
    const certificatesEarned = await this.certificateRepository.count({
      where: { userId },
    });

    // Count active predictions (status = LOCKED)
    const activePredictions = await this.predictionRepository.count({
      where: { userId, status: PredictionStatus.LOCKED },
    });

    // Get Energy Generation Trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Get energy readings grouped by month using query builder
    const energyReadings = await this.energyReadingRepository
      .createQueryBuilder('er')
      .select('er.timestamp', 'timestamp')
      .addSelect('er.verified_kwh', 'kwh')
      .where('er.installation_id IN (:...ids)', { ids: installationIds.length > 0 ? installationIds : [-1] })
      .andWhere('er.verified = :verified', { verified: true })
      .andWhere('er.timestamp >= :sixMonthsAgo', { sixMonthsAgo })
      .getMany();

    // Group by month in JavaScript (database-agnostic)
    const monthlyData = new Map<string, number>();
    energyReadings.forEach((er) => {
      const date = new Date(er.timestamp);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyData.get(monthStr) || 0;
      const energy = er.verifiedKwh ? parseFloat(er.verifiedKwh.toString()) : 0;
      monthlyData.set(monthStr, current + energy);
    });

    const energyTrend: { month: string; energy: number }[] = [];
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      energyTrend.push({
        month: monthStr,
        energy: monthlyData.get(monthStr) || 0,
      });
    }

    // Get Rewards Distribution by category
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
        percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
      };
    });

    // Get recent activity from reward transactions, certificates, and predictions
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

    // Add reward activities
    recentRewards.forEach((reward) => {
      allActivities.push({
        type: 'tokens',
        description: `Earned ${parseFloat(reward.tokensAmount.toString()).toFixed(2)} WATT from ${parseFloat(reward.kwhRewarded.toString()).toFixed(2)} kWh`,
        date: reward.issuedAt,
        amount: parseFloat(reward.tokensAmount.toString()),
      });
    });

    // Add certificate activities
    recentCertificates.forEach((cert) => {
      allActivities.push({
        type: 'certificate',
        description: `Certificate generated for ${cert.month}/${cert.year} - ${parseFloat(cert.totalKwh.toString()).toFixed(2)} kWh`,
        date: cert.generatedAt,
      });
    });

    // Sort by date and take the most recent 10
    const recentActivity = allActivities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return {
      totalEnergyGenerated,
      totalTokensEarned,
      tokensRedeemed,
      tokensAvailable,
      activePredictions,
      certificatesEarned,
      energyGenerationTrend: energyTrend,
      rewardsDistribution,
      recentActivity,
    };
  }
}
