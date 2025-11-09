import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity, AuditAction } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repository: Repository<AuditLogEntity>,
  ) {}

  async create(data: {
    userId?: string;
    performedBy?: string;
    action: AuditAction;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<AuditLogEntity> {
    const log = this.repository.create(data);
    return this.repository.save(log);
  }

  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<[AuditLogEntity[], number]> {
    return this.repository.findAndCount({
      where: [{ userId }, { performedBy: userId }],
      relations: ['user', 'performer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findAll(page: number = 1, limit: number = 50): Promise<[AuditLogEntity[], number]> {
    return this.repository.findAndCount({
      relations: ['user', 'performer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}

