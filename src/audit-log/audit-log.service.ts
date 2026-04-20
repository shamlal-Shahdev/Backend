import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from './entity/audit-log.entity';

export type AuditAppendInput = {
  actorUserId: number | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
};

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  async append(input: AuditAppendInput): Promise<void> {
    const row = this.repo.create({
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? null,
      ip: input.ip ?? null,
    });
    await this.repo.save(row);
  }

  async findPage(params: {
    actorUserId?: number;
    page: number;
    limit: number;
  }): Promise<{
    logs: AuditLogEntity[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const page = Math.max(1, params.page);
    const limit = Math.min(200, Math.max(1, params.limit));
    const qb = this.repo.createQueryBuilder('a').orderBy('a.created_at', 'DESC');
    if (params.actorUserId !== undefined && params.actorUserId !== null) {
      qb.andWhere('a.actor_user_id = :actorUserId', {
        actorUserId: params.actorUserId,
      });
    }
    const [logs, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }
}
