import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorDashboardController } from './dashboard.controller';
import { VendorDashboardService } from './dashboard.service';
import { InstallationEntity } from '../../installation/entity/installation.entity';
import { VendorCompanyProfileModule } from '../company-profile/vendor-company-profile.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InstallationEntity]),
    VendorCompanyProfileModule,
  ],
  controllers: [VendorDashboardController],
  providers: [VendorDashboardService],
  exports: [VendorDashboardService],
})
export class VendorDashboardModule {}
