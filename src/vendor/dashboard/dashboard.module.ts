import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorDashboardController } from './dashboard.controller';
import { VendorDashboardService } from './dashboard.service';
import { InstallationEntity } from '../../installation/entity/installation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InstallationEntity])],
  controllers: [VendorDashboardController],
  providers: [VendorDashboardService],
  exports: [VendorDashboardService],
})
export class VendorDashboardModule {}
