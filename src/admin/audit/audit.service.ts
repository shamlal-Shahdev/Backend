import { Injectable, Logger } from '@nestjs/common';
import { AuditLogService } from '../../audit-log/audit-log.service';

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(private readonly auditLogService: AuditLogService) {}

  async getAuditLogs(
    userId?: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const actorUserId =
      userId !== undefined && userId !== null && userId !== ''
        ? parseInt(userId, 10)
        : undefined;
    if (userId && (actorUserId === undefined || Number.isNaN(actorUserId))) {
      this.logger.warn(`Invalid userId query for audit logs: ${userId}`);
    }
    return this.auditLogService.findPage({
      actorUserId:
        actorUserId !== undefined && !Number.isNaN(actorUserId)
          ? actorUserId
          : undefined,
      page,
      limit,
    });
  }
}
