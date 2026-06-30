import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { AllConfigType } from '../config/config.type';
import {
  PredictionEntity,
  PredictionStatus,
} from './entity/prediction.entity';
import { SubmitPredictionDto } from './dto/submit-prediction.dto';
import { UpdatePredictionDto } from './dto/update-prediction.dto';
import { KycService } from '../kyc/kyc.service';
import { KycSubmissionStatus } from '../kyc/kyc-submission-status.enum';
import {
  InstallationEntity,
  InstallationStatus,
} from '../installation/entity/installation.entity';
import { PredictionEvaluationService } from './prediction-evaluation.service';

export type PredictionWindowStatus = {
  isOpen: boolean;
  windowStartDay: number;
  windowEndDay: number;
  currentDay: number;
  targetMonth: number;
  targetYear: number;
  message: string;
};

export type PredictionEligibility = {
  kycApproved: boolean;
  installationCompleted: boolean;
  eligible: boolean;
  completedInstallations: Array<{ id: number; name: string }>;
  reasons: string[];
};

export type PredictionRewardTier = {
  minAccuracy: number;
  maxAccuracy: number | null;
  label: string;
  tokens: number;
};

export type PredictionRewardTiers = {
  tiers: PredictionRewardTier[];
  maxTokens: number;
};

export type PredictionStatusResponse = {
  window: PredictionWindowStatus;
  eligibility: PredictionEligibility;
  currentMonthPrediction: PredictionEntity | null;
  hasSubmittedThisMonth: boolean;
  rewardTiers: PredictionRewardTiers;
};

@Injectable()
export class PredictionService {
  private readonly WINDOW_START_DAY = 1;
  private readonly WINDOW_END_DAY = 3;

  constructor(
    @InjectRepository(PredictionEntity)
    private readonly predictionRepository: Repository<PredictionEntity>,
    @InjectRepository(InstallationEntity)
    private readonly installationRepository: Repository<InstallationEntity>,
    private readonly kycService: KycService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly predictionEvaluationService: PredictionEvaluationService,
  ) {}

  private isWindowAlwaysOpen(): boolean {
    return this.configService.get('app.predictionWindowAlwaysOpen', {
      infer: true,
    })!;
  }

  getRewardTiers(): PredictionRewardTiers {
    const high = this.configService.get('app.predictionRewardHigh', {
      infer: true,
    })!;
    const medium = this.configService.get('app.predictionRewardMedium', {
      infer: true,
    })!;
    const low = this.configService.get('app.predictionRewardLow', {
      infer: true,
    })!;

    return {
      maxTokens: high,
      tiers: [
        { minAccuracy: 95, maxAccuracy: null, label: 'High', tokens: high },
        { minAccuracy: 90, maxAccuracy: 94, label: 'Medium', tokens: medium },
        { minAccuracy: 80, maxAccuracy: 89, label: 'Low', tokens: low },
      ],
    };
  }

  getWindowStatus(now = new Date()): PredictionWindowStatus {
    const currentDay = now.getDate();
    const targetMonth = now.getMonth() + 1;
    const targetYear = now.getFullYear();
    const alwaysOpen = this.isWindowAlwaysOpen();
    const isOpen =
      alwaysOpen ||
      (currentDay >= this.WINDOW_START_DAY &&
        currentDay <= this.WINDOW_END_DAY);

    let message: string;
    if (alwaysOpen) {
      message = `Prediction window is open until the ${this.WINDOW_END_DAY}${this.ordinalSuffix(this.WINDOW_END_DAY)} of this month.`;
    } else if (isOpen) {
      message = `Prediction window is open until the ${this.WINDOW_END_DAY}${this.ordinalSuffix(this.WINDOW_END_DAY)} of this month.`;
    } else if (currentDay < this.WINDOW_START_DAY) {
      message = `Prediction window opens on the ${this.WINDOW_START_DAY}${this.ordinalSuffix(this.WINDOW_START_DAY)} of each month.`;
    } else {
      message = `Prediction window closed. It reopens on the ${this.WINDOW_START_DAY}${this.ordinalSuffix(this.WINDOW_START_DAY)} of next month.`;
    }

    return {
      isOpen,
      windowStartDay: this.WINDOW_START_DAY,
      windowEndDay: this.WINDOW_END_DAY,
      currentDay,
      targetMonth,
      targetYear,
      message,
    };
  }

  async getEligibility(userId: number): Promise<PredictionEligibility> {
    const reasons: string[] = [];
    const kyc = await this.kycService.getLatestKycForUser(userId);
    const kycApproved = kyc?.status === KycSubmissionStatus.APPROVED;
    if (!kycApproved) {
      reasons.push('KYC must be approved before submitting a prediction.');
    }

    const installations = await this.installationRepository.find({
      where: { userId, status: InstallationStatus.COMPLETED, isActive: true },
      select: ['id', 'name'],
    });
    const installationCompleted = installations.length > 0;
    if (!installationCompleted) {
      reasons.push('At least one installation must be completed.');
    }

    return {
      kycApproved,
      installationCompleted,
      eligible: kycApproved && installationCompleted,
      completedInstallations: installations.map((i) => ({
        id: i.id,
        name: i.name,
      })),
      reasons,
    };
  }

  async getStatus(userId: number): Promise<PredictionStatusResponse> {
    await this.predictionEvaluationService.reconcileLockedPredictionsForUser(
      userId,
    );

    const window = this.getWindowStatus();
    const eligibility = await this.getEligibility(userId);

    const currentMonthPrediction = await this.predictionRepository.findOne({
      where: {
        userId,
        month: window.targetMonth,
        year: window.targetYear,
      },
      relations: ['installation', 'predictionResult'],
      order: { submittedAt: 'DESC' },
    });

    return {
      window,
      eligibility,
      currentMonthPrediction,
      hasSubmittedThisMonth: !!currentMonthPrediction,
      rewardTiers: this.getRewardTiers(),
    };
  }

  async submit(
    userId: number,
    dto: SubmitPredictionDto,
  ): Promise<PredictionEntity> {
    const window = this.getWindowStatus();
    if (!window.isOpen) {
      throw new BadRequestException(
        'Prediction window is closed. Submissions are only allowed from the 1st to the 3rd of each month.',
      );
    }

    const eligibility = await this.getEligibility(userId);
    if (!eligibility.eligible) {
      throw new ForbiddenException(eligibility.reasons.join(' '));
    }

    const installation = await this.installationRepository.findOne({
      where: {
        id: dto.installationId,
        userId,
        status: InstallationStatus.COMPLETED,
        isActive: true,
      },
    });
    if (!installation) {
      throw new BadRequestException(
        'Invalid installation. Select a completed installation that belongs to your account.',
      );
    }

    const existing = await this.predictionRepository.findOne({
      where: {
        userId,
        month: window.targetMonth,
        year: window.targetYear,
      },
    });
    if (existing) {
      throw new ConflictException(
        'You have already submitted a prediction for this month. Predictions cannot be edited once submitted.',
      );
    }

    const prediction = this.predictionRepository.create({
      userId,
      installationId: dto.installationId,
      month: window.targetMonth,
      year: window.targetYear,
      predictedKwh: dto.predictedKwh,
      status: PredictionStatus.LOCKED,
    });

    const saved = await this.predictionRepository.save(prediction);

    await this.predictionEvaluationService.tryEvaluateIfUsageAvailable(
      saved.installationId,
      saved.year,
      saved.month,
    );

    return this.findOne(saved.id, userId);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    userId?: number,
  ): Promise<{ data: PredictionEntity[]; total: number; page: number; limit: number }> {
    const where = userId ? { userId } : {};
    const [data, total] = await this.predictionRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'installation', 'predictionResult'],
      order: { submittedAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async findHistory(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: PredictionEntity[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, userId);
  }

  async findOne(id: number, userId?: number): Promise<PredictionEntity> {
    const prediction = await this.predictionRepository.findOne({
      where: userId ? { id, userId } : { id },
      relations: ['user', 'installation', 'predictionResult'],
    });
    if (!prediction) {
      throw new NotFoundException(`Prediction with ID ${id} not found`);
    }
    return prediction;
  }

  async update(
    id: number,
    updatePredictionDto: UpdatePredictionDto,
  ): Promise<PredictionEntity> {
    const prediction = await this.findOne(id);
    if (prediction.status === PredictionStatus.LOCKED) {
      throw new BadRequestException(
        'Locked predictions cannot be modified.',
      );
    }
    Object.assign(prediction, updatePredictionDto);
    return this.predictionRepository.save(prediction);
  }

  async remove(id: number): Promise<void> {
    const prediction = await this.findOne(id);
    await this.predictionRepository.remove(prediction);
  }

  private ordinalSuffix(day: number): string {
    if (day >= 11 && day <= 13) {
      return 'th';
    }
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }
}
