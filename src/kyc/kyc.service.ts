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

      // Update user's KYC status to pending
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

  async getUserKycStatus(
    userId: number,
  ): Promise<{ status: KycStatus; userId: number }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'kycStatus'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return {
      status: user.kycStatus,
      userId: user.id,
    };
  }
}
