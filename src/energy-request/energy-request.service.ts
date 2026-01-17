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
import { EnergyRequestEntity, EnergyRequestStatus } from './entity/energy-request.entity';
import { UploadEnergyRequestDto } from './dto/upload-energy-request.dto';
import { UserEntity } from '../user/entity/user.entity';
import { FilesService } from '../files/files.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class EnergyRequestService {
  private readonly logger = new Logger(EnergyRequestService.name);

  constructor(
    @InjectRepository(EnergyRequestEntity)
    private readonly energyRequestRepository: Repository<EnergyRequestEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly filesService: FilesService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Validate image type (jpg/png), size, and content (magic bytes)
   */
  private async validateImageFile(file: Express.Multer.File): Promise<void> {
    // Validate file type
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

    // Validate file extension
    if (!file.originalname.match(allowedExtensions)) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: {
          file: 'Invalid file extension. Only .jpg, .jpeg, and .png files are allowed.',
        },
      });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new UnprocessableEntityException({
        status: 413,
        errors: {
          file: 'File size exceeds the maximum allowed size of 5MB.',
        },
      });
    }

    // Validate file is not empty
    if (!file.size || file.size === 0) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: {
          file: 'File is empty. Please upload a valid image file.',
        },
      });
    }

    // Validate image content using magic bytes (file signature)
    // JPEG: FF D8 FF
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    // Note: file.buffer is available when using memory storage (multer.memoryStorage())
    // For disk storage, we'd need to read the file from disk
    let buffer: Buffer | undefined = file.buffer;
    
    // If buffer is not available (disk storage), we skip magic bytes check
    // The fileFilter in multer configuration already validates MIME type
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
      // Buffer not available but file has size - likely disk storage
      // Log warning but allow (MIME type validation already done by multer)
      this.logger.warn('File buffer not available for magic bytes validation. Relying on MIME type validation.');
    }

    // Validate image dimensions (min 100x100, max 10000x10000)
    // Note: For full dimension validation, we'd need to parse the image
    // For now, we validate file is readable by checking it has minimum expected size
    // A valid small image should be at least a few KB
    if (file.size < 1000) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: {
          file: 'Image file is too small. Please upload a valid image file.',
        },
      });
    }
  }

  /**
   * Upload energy generation request with image
   */
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

    // Validate file if provided
    if (file) {
      await this.validateImageFile(file);
    }

    // Validate month and year
    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }

    if (year < 2000 || year > 2100) {
      throw new BadRequestException('Year must be between 2000 and 2100');
    }

    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check for existing request for the same month/year
    const existingRequest = await this.energyRequestRepository.findOne({
      where: { userId, month, year },
    });

    if (existingRequest) {
      // If status is PENDING, block submission
      if (existingRequest.status === EnergyRequestStatus.PENDING) {
        throw new ConflictException(
          `You already have a pending request for ${month}/${year}. Please wait for admin review.`,
        );
      }

      // If reward already generated, block submission
      if (existingRequest.status === EnergyRequestStatus.REWARD_GENERATED) {
        throw new ConflictException(
          `Reward has already been generated for ${month}/${year}. You cannot submit again.`,
        );
      }

      // If status is REJECTED, allow resubmission by updating the existing record
      if (existingRequest.status === EnergyRequestStatus.REJECTED) {
        // Upload file and get URL if file is provided
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

        // Update existing request
        existingRequest.meterImageUrl = meterImageUrl;
        existingRequest.meterIdFromImage = meterIdFromImage || null;
        existingRequest.status = EnergyRequestStatus.PENDING;
        existingRequest.adminRemark = null;
        existingRequest.approvedByAdminId = null;
        existingRequest.rewardAmount = null;
        existingRequest.blockchainTxHash = null;

        const updatedRequest = await this.energyRequestRepository.save(existingRequest);
        this.logger.log(`Updated rejected request ${updatedRequest.id} to PENDING`);

        return updatedRequest;
      }
    }

    // Upload file and get URL
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

    // Create new request
    const energyRequest = this.energyRequestRepository.create({
      userId,
      meterImageUrl,
      meterIdFromImage: meterIdFromImage || null,
      month,
      year,
      status: EnergyRequestStatus.PENDING,
    });

    const savedRequest = await this.energyRequestRepository.save(energyRequest);
    this.logger.log(`Created energy request ${savedRequest.id} for user ${userId}`);

    // Send email notification
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
      // Don't throw error - submission should succeed even if email fails
    }

    return savedRequest;
  }

  /**
   * Get user's energy request status
   */
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

  /**
   * Get a specific energy request by ID (for user's own requests)
   */
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

