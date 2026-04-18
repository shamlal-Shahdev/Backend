import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycEntity } from './entity/kyc.entity';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { UserEntity, KycStatus } from '../user/entity/user.entity';
@Injectable()
export class KycService {
  constructor(
    @InjectRepository(KycEntity)
    private readonly kycRepository: Repository<KycEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  async create(createKycDto: CreateKycDto): Promise<KycEntity> {
    try {
      const kyc = this.kycRepository.create(createKycDto);
      const savedKyc = await this.kycRepository.save(kyc);
      await this.userRepository.update(
        { id: createKycDto.userId },
        { kycStatus: KycStatus.IN_REVIEW },
      );
      return savedKyc;
    } catch (error) {
      console.error('Failed to create KYC document', error);
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
  async getUserKycStatus(userId: number): Promise<{
    status: KycStatus;
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
      select: ['id', 'kycStatus'],
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
      ],
    });
    let rejectionReason: string | null = null;
    if (kycDocuments.length > 0) {
      const mostRecentDoc = kycDocuments[0];
      if (mostRecentDoc.adminNotes) {
        rejectionReason = mostRecentDoc.adminNotes;
      }
    }
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
            status: user.kycStatus,
            submittedAt: doc.submittedAt,
            adminNotes: doc.adminNotes,
          });
        }
      });
    });
    return {
      status: user.kycStatus,
      userId: user.id,
      rejectionReason,
      documents: documents.length > 0 ? documents : undefined,
    };
  }
}
