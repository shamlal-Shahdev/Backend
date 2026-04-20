import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorInstallationController } from './vendor-installation.controller';
import { VendorInstallationService } from './vendor-installation.service';
import { InstallationEntity } from '../../installation/entity/installation.entity';
import { VendorCompanyProfileModule } from '../company-profile/vendor-company-profile.module';
import { AuditLogModule } from '../../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InstallationEntity]),
    VendorCompanyProfileModule,
    AuditLogModule,
  ],
  controllers: [VendorInstallationController],
  providers: [VendorInstallationService],
  exports: [VendorInstallationService],
})
export class VendorInstallationModule {}
