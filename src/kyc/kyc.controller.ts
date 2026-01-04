import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
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
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { RoleEnum } from '../roles/roles.enum';
import { KycService } from './kyc.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { KycStatusResponseDto } from './dto/kyc-status-response.dto';
import { KycEntity } from './entity/kyc.entity';

@ApiTags('KYC Documents')
@Controller({
  path: 'kyc',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit a KYC document' })
  @ApiResponse({
    status: 201,
    description: 'KYC document submitted successfully',
    type: KycEntity,
  })
  @Roles(RoleEnum.user)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createKycDto: CreateKycDto): Promise<KycEntity> {
    console.log('Create KYC DTO', createKycDto);
    return this.kycService.create(createKycDto);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current user KYC status' })
  @ApiResponse({
    status: 200,
    description: 'KYC status retrieved successfully',
    type: KycStatusResponseDto,
  })
  @Roles(RoleEnum.user)
  async getKycStatus(@Request() req): Promise<KycStatusResponseDto> {
    const userId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.kycService.getUserKycStatus(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all KYC documents with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of KYC documents',
    type: [KycEntity],
  })
  @Roles(RoleEnum.admin)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.kycService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a KYC document by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'KYC document found',
    type: KycEntity,
  })
  @ApiResponse({ status: 404, description: 'KYC document not found' })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<KycEntity> {
    return this.kycService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a KYC document (approve/reject)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'KYC document updated successfully',
    type: KycEntity,
  })
  @ApiResponse({ status: 404, description: 'KYC document not found' })
  @Roles(RoleEnum.admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateKycDto: UpdateKycDto,
  ): Promise<KycEntity> {
    return this.kycService.update(id, updateKycDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a KYC document' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 204,
    description: 'KYC document deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'KYC document not found' })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.kycService.remove(id);
  }
}
