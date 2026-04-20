import { Module } from '@nestjs/common';
import { AdminAuditController } from './audit.controller';
import { AdminAuditService } from './audit.service';
import { AuditLogModule } from '../../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [AdminAuditController],
  providers: [AdminAuditService],
  exports: [AdminAuditService],
})
export class AdminAuditModule {}
