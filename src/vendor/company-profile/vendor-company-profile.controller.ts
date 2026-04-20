import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VendorGuard } from '../../auth/guards/vendor.guard';
import { VendorCompanyProfileService } from './vendor-company-profile.service';
import { UpsertVendorCompanyProfileDto } from './dto/upsert-vendor-company-profile.dto';
import { VendorCompanyProfileEntity } from './entity/vendor-company-profile.entity';

@ApiTags('Vendor - Company profile')
@Controller({ path: 'vendor/company-profile', version: '1' })
@UseGuards(AuthGuard('jwt'), VendorGuard)
@ApiBearerAuth()
export class VendorCompanyProfileController {
  constructor(private readonly service: VendorCompanyProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current vendor company profile' })
  @ApiResponse({ status: 200, type: VendorCompanyProfileEntity })
  async getMine(@Request() req): Promise<VendorCompanyProfileEntity | null> {
    const userId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.service.findByUserId(userId);
  }

  @Put()
  @ApiOperation({ summary: 'Create or update vendor company profile' })
  @ApiResponse({ status: 200, type: VendorCompanyProfileEntity })
  async upsert(
    @Request() req,
    @Body() dto: UpsertVendorCompanyProfileDto,
  ): Promise<VendorCompanyProfileEntity> {
    const userId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.service.upsert(userId, dto);
  }
}
