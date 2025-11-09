import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { KycEntity } from '../entities/kyc.entity';

@Injectable()
export class KycRepository {
  constructor(
    @InjectRepository(KycEntity)
    private readonly repository: Repository<KycEntity>,
  ) {}

  async create(data: Partial<KycEntity>): Promise<KycEntity> {
    const kyc = this.repository.create(data);
    return this.repository.save(kyc);
  }

  async findOne(where: FindOptionsWhere<KycEntity>): Promise<KycEntity | null> {
    return this.repository.findOne({ where, relations: ['documents', 'user'] });
  }

  async findOneByUserId(userId: string): Promise<KycEntity | null> {
    return this.repository.findOne({
      where: { userId },
      relations: ['documents'],
    });
  }

  async findOneByCnic(cnicNumber: string): Promise<KycEntity | null> {
    return this.repository.findOne({
      where: { cnicNumber },
    });
  }

  async update(id: string, data: Partial<KycEntity>): Promise<KycEntity | null> {
    await this.repository.update(id, data);
    return this.findOne({ id });
  }

  async findAll(): Promise<KycEntity[]> {
    return this.repository.find({ relations: ['user', 'documents'] });
  }
}

