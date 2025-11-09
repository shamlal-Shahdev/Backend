import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { KycRepository } from './infrastructure/persistence/relational/repositories/kyc.repository';
import { DocumentRepository } from './infrastructure/persistence/relational/repositories/document.repository';
import { AuditLogRepository } from './infrastructure/persistence/relational/repositories/audit-log.repository';
import { FilesService } from '../files/files.service';
import { KycStatus, DocumentType, DocumentStatus, AuditAction } from './infrastructure/persistence/relational/entities';
import { ResubmitKycDto } from './dto/resubmit-kyc.dto';
import { UpdateUserKycDto } from './dto/update-user-kyc.dto';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private readonly kycRepository: KycRepository,
    private readonly documentRepository: DocumentRepository,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly filesService: FilesService,
  ) {}

  async createKycSubmission(data: {
    userId: string;
    cnicNumber: string;
    city: string;
    province: string;
    country: string;
    gender: string;
    dateOfBirth: Date;
    phone?: string;
    cnicFront: Express.Multer.File;
    cnicBack: Express.Multer.File;
    selfie: Express.Multer.File;
  }) {
    try {
      // Check if CNIC already exists
      const existingKyc = await this.kycRepository.findOneByCnic(data.cnicNumber);
      if (existingKyc) {
        throw new ConflictException('CNIC number already registered');
      }

      // Check if user already has KYC
      const existingUserKyc = await this.kycRepository.findOneByUserId(data.userId);
      if (existingUserKyc) {
        throw new ConflictException('User already has a KYC submission');
      }

      // Upload files
      const cnicFrontFile = await this.filesService.uploadFile(data.cnicFront);
      const cnicBackFile = await this.filesService.uploadFile(data.cnicBack);
      const selfieFile = await this.filesService.uploadFile(data.selfie);

      // Create KYC record
      const kyc = await this.kycRepository.create({
        userId: data.userId,
        cnicNumber: data.cnicNumber,
        city: data.city,
        province: data.province,
        country: data.country,
        gender: data.gender as any,
        dateOfBirth: data.dateOfBirth,
        phone: data.phone,
        status: KycStatus.PENDING,
        submissionCount: 1,
      });

      // Create document records
      await this.documentRepository.createMany([
        {
          kycId: kyc.id,
          type: DocumentType.CNIC_FRONT,
          s3Key: cnicFrontFile.id,
          s3Bucket: 'kyc-documents',
          fileName: data.cnicFront.originalname,
          fileSize: data.cnicFront.size,
          mimeType: data.cnicFront.mimetype,
          status: DocumentStatus.PENDING,
        },
        {
          kycId: kyc.id,
          type: DocumentType.CNIC_BACK,
          s3Key: cnicBackFile.id,
          s3Bucket: 'kyc-documents',
          fileName: data.cnicBack.originalname,
          fileSize: data.cnicBack.size,
          mimeType: data.cnicBack.mimetype,
          status: DocumentStatus.PENDING,
        },
        {
          kycId: kyc.id,
          type: DocumentType.SELFIE,
          s3Key: selfieFile.id,
          s3Bucket: 'kyc-documents',
          fileName: data.selfie.originalname,
          fileSize: data.selfie.size,
          mimeType: data.selfie.mimetype,
          status: DocumentStatus.PENDING,
        },
      ]);

      // Create audit log
      await this.auditLogRepository.create({
        userId: data.userId,
        action: AuditAction.KYC_SUBMITTED,
        description: 'KYC documents submitted',
      });

      this.logger.log(`KYC submitted for user ${data.userId}`);
      return kyc;
    } catch (error) {
      this.logger.error(`Error creating KYC submission: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getKycStatus(userId: string) {
    const kyc = await this.kycRepository.findOneByUserId(userId);

    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    return {
      id: kyc.id,
      status: kyc.status,
      rejectionReason: kyc.rejectionReason,
      submissionCount: kyc.submissionCount,
      reviewedAt: kyc.reviewedAt,
      approvedAt: kyc.approvedAt,
      documents: kyc.documents.map((doc) => ({
        id: doc.id,
        type: doc.type,
        status: doc.status,
        fileName: doc.fileName,
        createdAt: doc.createdAt,
      })),
      createdAt: kyc.createdAt,
      updatedAt: kyc.updatedAt,
    };
  }

  async resubmitKyc(
    userId: string,
    dto: ResubmitKycDto,
    files: {
      cnicFront?: Express.Multer.File[];
      cnicBack?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
  ) {
    const kyc = await this.kycRepository.findOneByUserId(userId);

    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    if (kyc.status !== KycStatus.REJECTED) {
      throw new BadRequestException('Can only resubmit rejected KYC applications');
    }

    // Upload new files if provided
    if (files.cnicFront && files.cnicFront.length > 0) {
      const file = await this.filesService.uploadFile(files.cnicFront[0]);
      const existingDoc = kyc.documents.find((d) => d.type === DocumentType.CNIC_FRONT);
      
      if (existingDoc) {
        await this.documentRepository.update(existingDoc.id, {
          s3Key: file.id,
          fileName: files.cnicFront[0].originalname,
          fileSize: files.cnicFront[0].size,
          mimeType: files.cnicFront[0].mimetype,
          status: DocumentStatus.PENDING,
        });
      }
    }

    if (files.cnicBack && files.cnicBack.length > 0) {
      const file = await this.filesService.uploadFile(files.cnicBack[0]);
      const existingDoc = kyc.documents.find((d) => d.type === DocumentType.CNIC_BACK);
      
      if (existingDoc) {
        await this.documentRepository.update(existingDoc.id, {
          s3Key: file.id,
          fileName: files.cnicBack[0].originalname,
          fileSize: files.cnicBack[0].size,
          mimeType: files.cnicBack[0].mimetype,
          status: DocumentStatus.PENDING,
        });
      }
    }

    if (files.selfie && files.selfie.length > 0) {
      const file = await this.filesService.uploadFile(files.selfie[0]);
      const existingDoc = kyc.documents.find((d) => d.type === DocumentType.SELFIE);
      
      if (existingDoc) {
        await this.documentRepository.update(existingDoc.id, {
          s3Key: file.id,
          fileName: files.selfie[0].originalname,
          fileSize: files.selfie[0].size,
          mimeType: files.selfie[0].mimetype,
          status: DocumentStatus.PENDING,
        });
      }
    }

    // Update KYC status
    await this.kycRepository.update(kyc.id, {
      status: KycStatus.PENDING,
      rejectionReason: undefined,
      submissionCount: kyc.submissionCount + 1,
    });

    // Create audit log
    await this.auditLogRepository.create({
      userId,
      action: AuditAction.KYC_RESUBMITTED,
      description: 'KYC documents resubmitted',
      metadata: { notes: dto.notes },
    });

    this.logger.log(`KYC resubmitted for user ${userId}`);

    return {
      success: true,
      message: 'KYC documents resubmitted successfully',
    };
  }

  async updateUserKyc(userId: string, dto: UpdateUserKycDto) {
    const kyc = await this.kycRepository.findOneByUserId(userId);

    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    const updateData: Partial<any> = {};
    if (dto.city) updateData.city = dto.city;
    if (dto.province) updateData.province = dto.province;
    if (dto.country) updateData.country = dto.country;
    if (dto.gender) updateData.gender = dto.gender;
    if (dto.dateOfBirth) updateData.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.phone) updateData.phone = dto.phone;

    await this.kycRepository.update(kyc.id, updateData);

    return {
      success: true,
      message: 'KYC information updated successfully',
    };
  }
}

