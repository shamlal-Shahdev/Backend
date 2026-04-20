import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorCompanyProfileEntity } from './entity/vendor-company-profile.entity';
import { VendorCompanyProfileService } from './vendor-company-profile.service';
import { VendorCompanyProfileController } from './vendor-company-profile.controller';
import { VendorCompanyProfileGuard } from '../../auth/guards/vendor-company-profile.guard';

@Module({
  imports: [TypeOrmModule.forFeature([VendorCompanyProfileEntity])],
  controllers: [VendorCompanyProfileController],
  providers: [VendorCompanyProfileService, VendorCompanyProfileGuard],
  exports: [VendorCompanyProfileService, VendorCompanyProfileGuard],
})
export class VendorCompanyProfileModule {}
