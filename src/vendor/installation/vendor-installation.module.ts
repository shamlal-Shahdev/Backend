import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorInstallationController } from './vendor-installation.controller';
import { VendorInstallationService } from './vendor-installation.service';
import { InstallationEntity } from '../../installation/entity/installation.entity';
@Module({
  imports: [TypeOrmModule.forFeature([InstallationEntity])],
  controllers: [VendorInstallationController],
  providers: [VendorInstallationService],
  exports: [VendorInstallationService],
})
export class VendorInstallationModule {}
