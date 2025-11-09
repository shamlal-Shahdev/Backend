import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KycEntity } from './infrastructure/persistence/relational/entities/kyc.entity';
import { DocumentEntity } from './infrastructure/persistence/relational/entities/document.entity';
import { AuditLogEntity } from './infrastructure/persistence/relational/entities/audit-log.entity';
import { KycRepository } from './infrastructure/persistence/relational/repositories/kyc.repository';
import { DocumentRepository } from './infrastructure/persistence/relational/repositories/document.repository';
import { AuditLogRepository } from './infrastructure/persistence/relational/repositories/audit-log.repository';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([KycEntity, DocumentEntity, AuditLogEntity]),
    FilesModule,
  ],
  controllers: [KycController],
  providers: [KycService, KycRepository, DocumentRepository, AuditLogRepository],
  exports: [KycService, KycRepository, DocumentRepository, AuditLogRepository],
})
export class KycModule {}

