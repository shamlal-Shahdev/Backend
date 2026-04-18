import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VendorGuard } from '../../auth/guards/vendor.guard';
import { VendorInstallationService } from './vendor-installation.service';
import { UpdateInstallationStatusDto } from './dto/update-installation-status.dto';
import { InstallationEntity } from '../../installation/entity/installation.entity';
@ApiTags('Vendor - Installations')
@Controller({
  path: 'vendor/installations',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), VendorGuard)
@ApiBearerAuth()
export class VendorInstallationController {
  constructor(
    private readonly vendorInstallationService: VendorInstallationService,
  ) {}
  @Get()
  @ApiOperation({ summary: 'Get all installations assigned to vendor' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Installations retrieved successfully',
  })
  async findAll(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const vendorId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.vendorInstallationService.findAll(vendorId, page, limit);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get installation details by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Installation ID' })
  @ApiResponse({
    status: 200,
    description: 'Installation found',
    type: InstallationEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Installation not found or not assigned to vendor',
  })
  async findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InstallationEntity> {
    const vendorId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.vendorInstallationService.findOne(id, vendorId);
  }
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update installation status (IN_PROGRESS, COMPLETED, or REJECTED)' })
  @ApiParam({ name: 'id', type: Number, description: 'Installation ID' })
  @ApiResponse({
    status: 200,
    description: 'Installation status updated successfully',
    type: InstallationEntity,
  })
  @ApiResponse({
    status: 403,
    description: 'Invalid status transition or permission denied',
  })
  @ApiResponse({
    status: 404,
    description: 'Installation not found or not assigned to vendor',
  })
  async updateStatus(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateInstallationStatusDto,
  ): Promise<InstallationEntity> {
    const vendorId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.vendorInstallationService.updateStatus(
      id,
      vendorId,
      updateStatusDto,
    );
  }
}
