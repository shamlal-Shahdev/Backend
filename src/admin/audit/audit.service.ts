import { Injectable, Logger } from '@nestjs/common';
@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);
  getAuditLogs(userId?: string, page: number = 1, limit: number = 50) {
    this.logger.warn('Audit logs functionality not yet implemented');
    return {
      logs: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }
}
