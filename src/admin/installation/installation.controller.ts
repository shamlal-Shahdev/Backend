import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
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
import { AdminGuard } from '../../auth/guards/admin.guard';
import { AdminInstallationService } from './installation.service';
import { UpdateInstallationDto } from '../../installation/dto/update-installation.dto';
import { AssignVendorDto } from './dto/assign-vendor.dto';
import { InstallationEntity } from '../../installation/entity/installation.entity';
@ApiTags('Admin - Installations')
@Controller({
  path: 'admin/installations',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), AdminGuard)
@ApiBearerAuth()
export class AdminInstallationController {
  constructor(
    private readonly adminInstallationService: AdminInstallationService,
  ) {}
  @Get()
  @ApiOperation({ summary: 'Get all installation requests with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Installation requests retrieved successfully',
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.adminInstallationService.findAll(page, limit);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get a single installation request by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Installation ID' })
  @ApiResponse({
    status: 200,
    description: 'Installation request found',
    type: InstallationEntity,
  })
  @ApiResponse({ status: 404, description: 'Installation request not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InstallationEntity> {
    return this.adminInstallationService.findOne(id);
  }
  @Patch(':id')
  @ApiOperation({
    summary: 'Update installation request (approve/reject/update status)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Installation ID' })
  @ApiResponse({
    status: 200,
    description: 'Installation request updated successfully',
    type: InstallationEntity,
  })
  @ApiResponse({ status: 404, description: 'Installation request not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInstallationDto: UpdateInstallationDto,
  ): Promise<InstallationEntity> {
    return this.adminInstallationService.update(id, updateInstallationDto);
  }
  @Patch(':id/assign')
  @ApiOperation({ 
    summary: 'Assign vendor to installation (Optional: Admin can reassign vendors)',
    description: 'NOTE: This is an optional enhancement. Per specification, users select vendors during request submission. This endpoint allows admin to reassign vendors if needed.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Installation ID' })
  @ApiResponse({
    status: 200,
    description: 'Vendor assigned successfully',
    type: InstallationEntity,
  })
  @ApiResponse({ status: 404, description: 'Installation or vendor not found' })
  @ApiResponse({ status: 400, description: 'User is not a vendor' })
  async assignVendor(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignVendorDto: AssignVendorDto,
  ): Promise<InstallationEntity> {
    return this.adminInstallationService.assignVendor(id, assignVendorDto);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an installation request' })
  @ApiParam({ name: 'id', type: Number, description: 'Installation ID' })
  @ApiResponse({
    status: 204,
    description: 'Installation request deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Installation request not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.adminInstallationService.remove(id);
  }
}
