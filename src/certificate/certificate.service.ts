import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CertificateEntity } from './entity/certificate.entity';
import {
  CertificateMonthStatus,
  CertificateSortOrder,
  CertificateStatus,
} from './certificate.enums';
import {
  AdminCertificateListQueryDto,
  CertificateListQueryDto,
} from './dto/certificate-list-query.dto';
import { CertificateResponseDto } from './dto/certificate-response.dto';
import {
  CertificateStatsResponseDto,
  CertificateVerifyResponseDto,
  LatestCertificateSummaryDto,
} from './dto/certificate-stats-response.dto';
import { CertificateMonthOverviewDto } from './dto/certificate-month-overview.dto';
import { getMonthOverMonthChange } from './certificate-metrics.util';
import {
  EnergyRequestEntity,
  EnergyRequestStatus,
} from '../energy-request/entity/energy-request.entity';
import {
  RewardReason,
  RewardTransactionEntity,
} from '../reward-transaction/entity/reward-transaction.entity';
import { CertificatePdfService } from './certificate-pdf.service';
import { AllConfigType } from '../config/config.type';
import { CertificateMapper } from './certificate.mapper';
import {
  CERTIFICATE_INSTALLATION_RELATIONS,
  CERTIFICATE_PDF_RELATIONS,
  MonthEnergyRecord,
} from './certificate.types';
import {
  asNumber,
  buildVerifyUrl,
  isDownloadableCertificate,
  parseUsagePeriod,
  periodFromDate,
  roundToTwoDecimals,
  sortMonthEnergyRecords,
  toPeriodKey,
  upsertMonthEnergyRecord,
} from './certificate.util';

@Injectable()
export class CertificateService {
  constructor(
    @InjectRepository(CertificateEntity)
    private readonly certificateRepository: Repository<CertificateEntity>,
    @InjectRepository(EnergyRequestEntity)
    private readonly energyRequestRepository: Repository<EnergyRequestEntity>,
    @InjectRepository(RewardTransactionEntity)
    private readonly rewardTransactionRepository: Repository<RewardTransactionEntity>,
    private readonly pdfService: CertificatePdfService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async findForUser(
    userId: number,
    query: CertificateListQueryDto,
  ): Promise<{ certificates: CertificateResponseDto[]; total: number }> {
    return this.findWithFilters({
      ...query,
      userId,
      status: CertificateStatus.ACTIVE,
    });
  }

  async findForAdmin(
    query: AdminCertificateListQueryDto,
  ): Promise<{ certificates: CertificateResponseDto[]; total: number }> {
    return this.findWithFilters(query);
  }

  async findUsersWithCertificates(
    page: number = 1,
    limit: number = 25,
  ): Promise<{
    items: Array<{
      userId: number;
      user: { id: number; name: string; email: string };
      certificateCount: number;
      totalEnergy: number;
      totalRewards: number;
      lastIssuedAt: Date;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const items = await this.certificateRepository
      .createQueryBuilder('c')
      .innerJoin('c.user', 'user')
      .select('c.user_id', 'userId')
      .addSelect('user.id', 'user_id')
      .addSelect('user.name', 'user_name')
      .addSelect('user.email', 'user_email')
      .addSelect('COUNT(c.id)', 'certificateCount')
      .addSelect('SUM(c.total_kwh)', 'totalEnergy')
      .addSelect('SUM(c.reward_amount)', 'totalRewards')
      .addSelect('MAX(c.generated_at)', 'lastIssuedAt')
      .where('c.total_kwh > 0')
      .groupBy('c.user_id')
      .addGroupBy('user.id')
      .addGroupBy('user.name')
      .addGroupBy('user.email')
      .orderBy('MAX(c.generated_at)', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    const countResult = await this.certificateRepository
      .createQueryBuilder('c')
      .select('COUNT(DISTINCT c.user_id)', 'count')
      .where('c.total_kwh > 0')
      .getRawOne<{ count: string }>();

    return {
      items: items.map((row) => ({
        userId: Number(row.userId),
        user: {
          id: Number(row.user_id),
          name: row.user_name,
          email: row.user_email,
        },
        certificateCount: Number(row.certificateCount),
        totalEnergy: Number(row.totalEnergy),
        totalRewards: Number(row.totalRewards),
        lastIssuedAt: row.lastIssuedAt,
      })),
      total: Number(countResult?.count ?? 0),
      page,
      limit,
    };
  }

  async getPdfDownloadForUser(
    userId: number,
    id: number,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const certificate = await this.findCertificateWithRelations(id, [
      ...CERTIFICATE_PDF_RELATIONS,
    ]);

    this.assertUserOwnsCertificate(certificate, userId);
    this.assertCertificateIsDownloadable(certificate);

    const verifyUrl =
      certificate.qrCodeUrl ??
      buildVerifyUrl(
        this.configService.getOrThrow('app.frontendUrl', { infer: true }),
        certificate.certificateId,
      );

    const buffer = await this.pdfService.generatePdf(
      CertificateMapper.toPdfInputFromEntity(certificate, verifyUrl),
    );

    return {
      buffer,
      filename: `${certificate.certificateId}.pdf`,
    };
  }

  async getUserMonthlyOverview(
    userId: number,
  ): Promise<CertificateMonthOverviewDto[]> {
    const energyByMonth = await this.getRewardedEnergyMonths(userId);
    const certificates = await this.certificateRepository.find({
      where: { userId },
      relations: [...CERTIFICATE_INSTALLATION_RELATIONS],
      order: { year: 'DESC', month: 'DESC' },
    });

    const certificateByPeriod = new Map<string, CertificateEntity>();
    for (const certificate of certificates) {
      certificateByPeriod.set(
        toPeriodKey(certificate.year, certificate.month),
        certificate,
      );
    }

    return energyByMonth.map((record) => {
      const certificate =
        certificateByPeriod.get(toPeriodKey(record.year, record.month)) ?? null;
      const downloadable =
        certificate !== null && isDownloadableCertificate(certificate);

      return {
        month: record.month,
        year: record.year,
        energyGeneratedKwh: record.energyGeneratedKwh,
        rewardAmount: record.rewardAmount,
        status: downloadable
          ? CertificateMonthStatus.DOWNLOADABLE
          : CertificateMonthStatus.PENDING_CERTIFICATE,
        downloadable,
        certificate: certificate
          ? CertificateMapper.toResponseDto(certificate)
          : null,
      };
    });
  }

  async verifyByPublicId(
    certificateId: string,
  ): Promise<CertificateVerifyResponseDto> {
    const certificate = await this.certificateRepository.findOne({
      where: { certificateId },
      relations: ['user'],
    });
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }
    return CertificateMapper.toVerifyResponse(certificate);
  }

  async getUserStats(userId: number): Promise<CertificateStatsResponseDto> {
    const certificates = await this.certificateRepository.find({
      where: { userId, status: CertificateStatus.ACTIVE },
      order: { year: 'DESC', month: 'DESC' },
    });

    let totalEnergy = 0;
    let totalRewards = 0;
    let totalCo2 = 0;
    for (const cert of certificates) {
      totalEnergy += asNumber(cert.totalKwh);
      totalRewards += asNumber(cert.rewardAmount);
      totalCo2 += asNumber(cert.totalCo2Offset);
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevDate.getMonth() + 1;
    const prevYear = prevDate.getFullYear();

    const currentCert = certificates.find(
      (c) => c.month === currentMonth && c.year === currentYear,
    );
    const previousCert = certificates.find(
      (c) => c.month === prevMonth && c.year === prevYear,
    );

    const comparison = getMonthOverMonthChange(
      currentCert ? asNumber(currentCert.totalKwh) : 0,
      previousCert ? asNumber(previousCert.totalKwh) : 0,
    );

    return {
      totalCertificates: certificates.length,
      totalEnergyGenerated: roundToTwoDecimals(totalEnergy),
      totalRewardsEarned: roundToTwoDecimals(totalRewards),
      totalCo2OffsetKg: roundToTwoDecimals(totalCo2),
      totalCo2OffsetTons: roundToTwoDecimals(totalCo2 / 1000),
      previousMonthEnergy: comparison.previousKwh,
      currentMonthEnergy: comparison.currentKwh,
      monthOverMonthPercentChange: comparison.percentChange,
      currentBadge: certificates.length > 0 ? certificates[0].badge : null,
    };
  }

  async getLatestForUser(
    userId: number,
  ): Promise<LatestCertificateSummaryDto | null> {
    const certificate = await this.certificateRepository.findOne({
      where: { userId, status: CertificateStatus.ACTIVE },
      order: { generatedAt: 'DESC' },
    });
    if (!certificate) {
      return null;
    }
    return CertificateMapper.toLatestSummary(certificate);
  }

  async revoke(id: number): Promise<CertificateEntity> {
    const certificate = await this.certificateRepository.findOne({
      where: { id },
    });
    if (!certificate) {
      throw new NotFoundException(`Certificate with ID ${id} not found`);
    }
    certificate.status = CertificateStatus.REVOKED;
    return this.certificateRepository.save(certificate);
  }

  async getAdminStats(): Promise<{
    totalCertificatesGenerated: number;
    certificatesThisMonth: number;
    totalEnergyCertified: number;
    totalCo2Offset: number;
    totalRewardsDistributed: number;
  }> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const totals = await this.certificateRepository
      .createQueryBuilder('c')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(c.totalKwh), 0)', 'energy')
      .addSelect('COALESCE(SUM(c.totalCo2Offset), 0)', 'co2')
      .addSelect('COALESCE(SUM(c.rewardAmount), 0)', 'rewards')
      .where('c.status = :status', { status: CertificateStatus.ACTIVE })
      .getRawOne<{
        count: string;
        energy: string;
        co2: string;
        rewards: string;
      }>();

    const thisMonthCount = await this.certificateRepository.count({
      where: { month, year, status: CertificateStatus.ACTIVE },
    });

    return {
      totalCertificatesGenerated: parseInt(totals?.count ?? '0', 10),
      certificatesThisMonth: thisMonthCount,
      totalEnergyCertified: parseFloat(totals?.energy ?? '0'),
      totalCo2Offset: parseFloat(totals?.co2 ?? '0'),
      totalRewardsDistributed: parseFloat(totals?.rewards ?? '0'),
    };
  }

  private async getRewardedEnergyMonths(
    userId: number,
  ): Promise<MonthEnergyRecord[]> {
    const byPeriod = new Map<string, MonthEnergyRecord>();

    const energyRequests = await this.energyRequestRepository.find({
      where: {
        userId,
        status: EnergyRequestStatus.REWARD_GENERATED,
      },
    });

    for (const request of energyRequests) {
      const energyKwh = asNumber(request.energyGeneratedKwh);
      if (energyKwh <= 0) {
        continue;
      }
      upsertMonthEnergyRecord(byPeriod, {
        month: request.month,
        year: request.year,
        energyGeneratedKwh: energyKwh,
        rewardAmount: asNumber(request.rewardAmount),
      });
    }

    const vendorRewards = await this.rewardTransactionRepository.find({
      where: {
        userId,
        reason: RewardReason.VENDOR_MONTHLY_USAGE,
      },
    });

    for (const reward of vendorRewards) {
      const energyKwh = asNumber(reward.kwhRewarded);
      if (energyKwh <= 0) {
        continue;
      }

      const period =
        parseUsagePeriod(reward.usagePeriodYearMonth) ??
        periodFromDate(reward.issuedAt);
      if (!period) {
        continue;
      }

      upsertMonthEnergyRecord(byPeriod, {
        month: period.month,
        year: period.year,
        energyGeneratedKwh: energyKwh,
        rewardAmount: asNumber(reward.tokensAmount),
      });
    }

    return sortMonthEnergyRecords(Array.from(byPeriod.values()));
  }

  private async findWithFilters(
    query: AdminCertificateListQueryDto,
  ): Promise<{ certificates: CertificateResponseDto[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.certificateRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.installation', 'installation')
      .leftJoinAndSelect('c.vendor', 'vendor')
      .andWhere('c.totalKwh > 0');

    if (query.userId) {
      qb.andWhere('c.userId = :userId', { userId: query.userId });
    }
    if (query.vendorId) {
      qb.andWhere('c.vendorId = :vendorId', { vendorId: query.vendorId });
    }
    if (query.month) {
      qb.andWhere('c.month = :month', { month: query.month });
    }
    if (query.year) {
      qb.andWhere('c.year = :year', { year: query.year });
    }
    if (query.status) {
      qb.andWhere('c.status = :status', { status: query.status });
    }

    const sortDir =
      query.sort === CertificateSortOrder.OLDEST ? 'ASC' : 'DESC';
    qb.orderBy('c.generatedAt', sortDir);
    qb.skip((page - 1) * limit).take(limit);

    const [rows, total] = await qb.getManyAndCount();
    return {
      certificates: rows.map((row) => CertificateMapper.toResponseDto(row)),
      total,
    };
  }

  private async findCertificateWithRelations(
    id: number,
    relations: readonly string[],
  ): Promise<CertificateEntity> {
    const certificate = await this.certificateRepository.findOne({
      where: { id },
      relations: [...relations],
    });
    if (!certificate) {
      throw new NotFoundException(`Certificate with ID ${id} not found`);
    }
    return certificate;
  }

  private assertUserOwnsCertificate(
    certificate: CertificateEntity,
    userId: number,
  ): void {
    if (certificate.userId !== userId) {
      throw new ForbiddenException('You do not have access to this certificate');
    }
  }

  private assertCertificateIsDownloadable(certificate: CertificateEntity): void {
    if (certificate.status !== CertificateStatus.ACTIVE) {
      throw new BadRequestException(
        'This certificate is not available for download.',
      );
    }
    if (asNumber(certificate.totalKwh) <= 0) {
      throw new BadRequestException(
        'Certificate download is only available for months with verified energy generation.',
      );
    }
  }
}
