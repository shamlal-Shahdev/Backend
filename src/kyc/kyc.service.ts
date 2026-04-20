import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycEntity } from './entity/kyc.entity';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { UserEntity } from '../user/entity/user.entity';
import { KycSubmissionStatus } from './kyc-submission-status.enum';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    @InjectRepository(KycEntity)
    private readonly kycRepository: Repository<KycEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(createKycDto: CreateKycDto): Promise<KycEntity> {
    try {
      const kyc = this.kycRepository.create({
        ...createKycDto,
        status: KycSubmissionStatus.IN_REVIEW,
        rejectionReason: null,
      });
      return await this.kycRepository.save(kyc);
    } catch (error) {
      this.logger.error('Failed to create KYC document', error);
      throw new InternalServerErrorException('Failed to create KYC document');
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<[KycEntity[], number]> {
    const [data, total] = await this.kycRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
      order: { submittedAt: 'DESC' },
    });
    return [data, total];
  }

  async findOne(id: number): Promise<KycEntity> {
    const kyc = await this.kycRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!kyc) {
      throw new NotFoundException(`KYC Document with ID ${id} not found`);
    }
    return kyc;
  }

  async update(id: number, updateKycDto: UpdateKycDto): Promise<KycEntity> {
    const kyc = await this.findOne(id);
    Object.assign(kyc, updateKycDto);
    return await this.kycRepository.save(kyc);
  }

  async remove(id: number): Promise<void> {
    const kyc = await this.findOne(id);
    await this.kycRepository.remove(kyc);
  }

  async getLatestKycForUser(userId: number): Promise<KycEntity | null> {
    return this.kycRepository.findOne({
      where: { userId },
      order: { submittedAt: 'DESC' },
    });
  }

  async getUserKycStatus(userId: number): Promise<{
    status: KycSubmissionStatus;
    userId: number;
    rejectionReason?: string | null;
    documents?: Array<{
      id: number;
      docType: string;
      status: string;
      submittedAt: Date;
      adminNotes?: string | null;
    }>;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    const kycDocuments = await this.kycRepository.find({
      where: { userId },
      order: { submittedAt: 'DESC' },
      select: [
        'id',
        'adminNotes',
        'submittedAt',
        'CnicFrontUrl',
        'CnicBackUrl',
        'SelfieUrl',
        'UtilityBillUrl',
        'status',
        'rejectionReason',
      ],
    });
    const latest = kycDocuments[0];
    const effectiveStatus =
      latest?.status ?? KycSubmissionStatus.NOT_SUBMITTED;
    const rejectionReason =
      latest?.rejectionReason ||
      latest?.adminNotes ||
      null;
    const documents: Array<{
      id: number;
      docType: string;
      status: string;
      submittedAt: Date;
      adminNotes?: string | null;
    }> = [];
    kycDocuments.forEach((doc) => {
      const docTypes = [
        { type: 'cnic_front', url: doc.CnicFrontUrl },
        { type: 'cnic_back', url: doc.CnicBackUrl },
        { type: 'selfie', url: doc.SelfieUrl },
        { type: 'utility_bill', url: doc.UtilityBillUrl },
      ];
      docTypes.forEach(({ type, url }) => {
        if (url) {
          documents.push({
            id: doc.id,
            docType: type,
            status: doc.status,
            submittedAt: doc.submittedAt,
            adminNotes: doc.adminNotes,
          });
        }
      });
    });
    return {
      status: effectiveStatus,
      userId: user.id,
      rejectionReason,
      documents: documents.length > 0 ? documents : undefined,
    };
  }
}
