import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorAuthModule } from './auth/vendor-auth.module';
import { VendorInstallationModule } from './installation/vendor-installation.module';
import { VendorDashboardModule } from './dashboard/dashboard.module';
import { VendorController } from './vendor.controller';
import { UserEntity } from '../user/entity/user.entity';
@Module({
  imports: [
    VendorAuthModule,
    VendorInstallationModule,
    VendorDashboardModule,
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [VendorController],
  exports: [VendorAuthModule, VendorInstallationModule, VendorDashboardModule],
})
export class VendorModule {}
