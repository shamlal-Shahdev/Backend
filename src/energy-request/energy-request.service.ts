import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EnergyRequestEntity,
  EnergyRequestStatus,
  KycMeterCrosscheck,
} from './entity/energy-request.entity';
import { UserEntity } from '../user/entity/user.entity';
import { KycEntity } from '../kyc/entity/kyc.entity';
import { FilesService } from '../files/files.service';
import { EmailService } from '../email/email.service';
import { MeterOcrService } from './meter-ocr.service';
@Injectable()
export class EnergyRequestService {
  private readonly logger = new Logger(EnergyRequestService.name);
  constructor(
    @InjectRepository(EnergyRequestEntity)
    private readonly energyRequestRepository: Repository<EnergyRequestEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(KycEntity)
    private readonly kycRepository: Repository<KycEntity>,
    private readonly filesService: FilesService,
    private readonly emailService: EmailService,
    private readonly meterOcrService: MeterOcrService,
  ) {}
  private normalizeMeterToken(value: string): string {
    return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }
  private async resolveKycCrosscheck(
    userId: number,
    meterGuess: string | null,
  ): Promise<KycMeterCrosscheck> {
    const latest = await this.kycRepository.findOne({
      where: { userId },
      order: { submittedAt: 'DESC' },
    });
    const ref = latest?.utilityMeterReference?.trim();
    if (!ref) {
      return KycMeterCrosscheck.NO_KYC_REFERENCE;
    }
    if (!meterGuess?.trim()) {
      return KycMeterCrosscheck.SKIPPED;
    }
    const a = this.normalizeMeterToken(ref);
    const b = this.normalizeMeterToken(meterGuess);
    if (a.length === 0 || b.length === 0) {
      return KycMeterCrosscheck.SKIPPED;
    }
    if (a === b) {
      return KycMeterCrosscheck.MATCH;
    }
    return KycMeterCrosscheck.MISMATCH;
  }
  private async enrichWithOcr(
    entity: EnergyRequestEntity,
    file: Express.Multer.File | undefined,
    clientMeterId: string | undefined,
    userId: number,
  ): Promise<EnergyRequestEntity> {
    if (!file?.buffer?.length) {
      const chosen = clientMeterId?.trim()
        ? clientMeterId.trim().toUpperCase()
        : null;
      entity.meterIdFromImage = chosen;
      entity.kycMeterCrosscheck = await this.resolveKycCrosscheck(
        userId,
        chosen,
      );
      return this.energyRequestRepository.save(entity);
    }
    const ocr = await this.meterOcrService.extractFromImage(file.buffer);
    entity.ocrRawText =
      ocr.rawText.length > 60000 ? ocr.rawText.slice(0, 60000) : ocr.rawText;
    entity.ocrAvgConfidence = ocr.avgConfidence;
    entity.ocrMeterIdCandidate = ocr.meterIdCandidate;
    const chosen =
      ocr.meterIdCandidate ||
      (clientMeterId?.trim() ? clientMeterId.trim().toUpperCase() : null);
    entity.meterIdFromImage = chosen;
    entity.kycMeterCrosscheck = await this.resolveKycCrosscheck(
      userId,
      chosen,
    );
    return this.energyRequestRepository.save(entity);
  }
  private async validateImageFile(file: Express.Multer.File): Promise<void> {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const allowedExtensions = /\.(jpg|jpeg|png)$/i;
    if (!file.mimetype || !allowedMimeTypes.includes(file.mimetype)) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: {
          file: 'Invalid file type. Only JPG and PNG images are allowed.',
        },
      });
    }
    if (!file.originalname.match(allowedExtensions)) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: {
          file: 'Invalid file extension. Only .jpg, .jpeg, and .png files are allowed.',
        },
      });
    }
    const maxSize = 5 * 1024 * 1024; 
    if (file.size > maxSize) {
      throw new UnprocessableEntityException({
        status: 413,
        errors: {
          file: 'File size exceeds the maximum allowed size of 5MB.',
        },
      });
    }
    if (!file.size || file.size === 0) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: {
          file: 'File is empty. Please upload a valid image file.',
        },
      });
    }
    let buffer: Buffer | undefined = file.buffer;
    if (buffer && buffer.length >= 8) {
      const fileHeader = buffer.slice(0, 8);
      const isJPEG =
        fileHeader[0] === 0xff &&
        fileHeader[1] === 0xd8 &&
        fileHeader[2] === 0xff;
      const isPNG =
        fileHeader[0] === 0x89 &&
        fileHeader[1] === 0x50 &&
        fileHeader[2] === 0x4e &&
        fileHeader[3] === 0x47 &&
        fileHeader[4] === 0x0d &&
        fileHeader[5] === 0x0a &&
        fileHeader[6] === 0x1a &&
        fileHeader[7] === 0x0a;
      if (!isJPEG && !isPNG) {
        throw new UnprocessableEntityException({
          status: 422,
          errors: {
            file: 'Invalid image file. File does not appear to be a valid JPG or PNG image. Please ensure the file is not corrupted.',
          },
        });
      }
    } else if (!buffer && file.size > 0) {
      this.logger.warn('File buffer not available for magic bytes validation. Relying on MIME type validation.');
    }
    if (file.size < 1000) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: {
          file: 'Image file is too small. Please upload a valid image file.',
        },
      });
    }
  }
  async uploadEnergyRequest(
    userId: number,
    file: Express.Multer.File,
    month: number,
    year: number,
    meterIdFromImage?: string,
  ): Promise<EnergyRequestEntity> {
    this.logger.log(
      `User ${userId} attempting to upload energy request for ${month}/${year}`,
    );
    if (file) {
      await this.validateImageFile(file);
    }
    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }
    if (year < 2000 || year > 2100) {
      throw new BadRequestException('Year must be between 2000 and 2100');
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const existingRequest = await this.energyRequestRepository.findOne({
      where: { userId, month, year },
    });
    if (existingRequest) {
      if (existingRequest.status === EnergyRequestStatus.PENDING) {
        throw new ConflictException(
          `You already have a pending request for ${month}/${year}. Please wait for admin review.`,
        );
      }
      if (existingRequest.status === EnergyRequestStatus.REWARD_GENERATED) {
        throw new ConflictException(
          `Reward has already been generated for ${month}/${year}. You cannot submit again.`,
        );
      }
      if (existingRequest.status === EnergyRequestStatus.REJECTED) {
        let meterImageUrl = existingRequest.meterImageUrl;
        if (file) {
          this.logger.log(`[File Upload - Resubmission] Original filename: ${file.originalname}`);
          this.logger.log(`[File Upload - Resubmission] File size: ${file.size} bytes`);
          const uploadedFile = await this.filesService.uploadFile(file, 'energy-requests');
          this.logger.log(`[File Upload - Resubmission] File key/path: ${uploadedFile.key}`);
          this.logger.log(`[File Upload - Resubmission] File URL: ${uploadedFile.url}`);
          this.logger.log(`[File Upload - Resubmission] Full disk path: ${process.cwd()}/files/${uploadedFile.key}`);
          this.logger.log(`[File Upload - Resubmission] Access URL: ${process.env.APP_URL || 'http://localhost:3000'}/api/v1/files/${uploadedFile.key}`);
          meterImageUrl = uploadedFile.url;
        }
        existingRequest.meterImageUrl = meterImageUrl;
        existingRequest.status = EnergyRequestStatus.PENDING;
        existingRequest.adminRemark = null;
        existingRequest.approvedByAdminId = null;
        existingRequest.rewardAmount = null;
        existingRequest.blockchainTxHash = null;
        existingRequest.ocrRawText = null;
        existingRequest.ocrAvgConfidence = null;
        existingRequest.ocrMeterIdCandidate = null;
        existingRequest.kycMeterCrosscheck = null;
        const updatedRequest = await this.energyRequestRepository.save(existingRequest);
        this.logger.log(`Updated rejected request ${updatedRequest.id} to PENDING`);
        return this.enrichWithOcr(
          updatedRequest,
          file,
          meterIdFromImage,
          userId,
        );
      }
    }
    let meterImageUrl: string;
    if (file) {
      this.logger.log(`[File Upload] Original filename: ${file.originalname}`);
      this.logger.log(`[File Upload] File size: ${file.size} bytes`);
      this.logger.log(`[File Upload] File MIME type: ${file.mimetype}`);
      const uploadedFile = await this.filesService.uploadFile(file, 'energy-requests');
      this.logger.log(`[File Upload] File ID: ${uploadedFile.id}`);
      this.logger.log(`[File Upload] File key/path: ${uploadedFile.key}`);
      this.logger.log(`[File Upload] File URL: ${uploadedFile.url}`);
      this.logger.log(`[File Upload] Full disk path: ${process.cwd()}/files/${uploadedFile.key}`);
      this.logger.log(`[File Upload] Access URL: ${process.env.APP_URL || 'http://localhost:3000'}/api/v1/files/${uploadedFile.key}`);
      meterImageUrl = uploadedFile.url;
    } else {
      throw new BadRequestException('Meter image file is required');
    }
    const energyRequest = this.energyRequestRepository.create({
      userId,
      meterImageUrl,
      meterIdFromImage: null,
      month,
      year,
      status: EnergyRequestStatus.PENDING,
    });
    const savedRequest = await this.energyRequestRepository.save(energyRequest);
    this.logger.log(`Created energy request ${savedRequest.id} for user ${userId}`);
    const withOcr = await this.enrichWithOcr(
      savedRequest,
      file,
      meterIdFromImage,
      userId,
    );
    try {
      await this.emailService.sendEnergyRequestSubmittedEmail(
        user.email,
        user.name,
        month,
        year,
      );
      this.logger.log(`Submission email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send submission email to ${user.email}:`,
        error,
      );
    }
    return withOcr;
  }
  async getUserEnergyRequestStatus(userId: number): Promise<{
    requests: EnergyRequestEntity[];
    total: number;
  }> {
    this.logger.log(`Getting energy request status for user ${userId}`);
    const requests = await this.energyRequestRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
    return {
      requests,
      total: requests.length,
    };
  }
  async getUserEnergyRequestById(
    userId: number,
    requestId: number,
  ): Promise<EnergyRequestEntity> {
    const request = await this.energyRequestRepository.findOne({
      where: { id: requestId, userId },
      relations: ['user'],
    });
    if (!request) {
      throw new NotFoundException('Energy request not found');
    }
    return request;
  }
}
