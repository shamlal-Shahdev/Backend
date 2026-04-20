import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorAuthModule } from './auth/vendor-auth.module';
import { VendorInstallationModule } from './installation/vendor-installation.module';
import { VendorDashboardModule } from './dashboard/dashboard.module';
import { VendorController } from './vendor.controller';
import { UserEntity } from '../user/entity/user.entity';
import { VendorUsageImportModule } from './usage-import/vendor-usage-import.module';
import { VendorCompanyProfileModule } from './company-profile/vendor-company-profile.module';

@Module({
  imports: [
    VendorAuthModule,
    VendorInstallationModule,
    VendorDashboardModule,
    VendorUsageImportModule,
    VendorCompanyProfileModule,
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [VendorController],
  exports: [
    VendorAuthModule,
    VendorInstallationModule,
    VendorDashboardModule,
    VendorCompanyProfileModule,
  ],
})
export class VendorModule {}
