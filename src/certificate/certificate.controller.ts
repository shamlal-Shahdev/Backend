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
import { CertificateService } from './certificate.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CertificateEntity } from './entity/certificate.entity';
@ApiTags('Certificates')
@Controller({
  path: 'certificates',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}
  @Post()
  @ApiOperation({ summary: 'Create a new certificate' })
  @ApiResponse({
    status: 201,
    description: 'Certificate created successfully',
    type: CertificateEntity,
  })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createCertificateDto: CreateCertificateDto,
  ): Promise<CertificateEntity> {
    return this.certificateService.create(createCertificateDto);
  }
  @Get()
  @ApiOperation({ summary: 'Get all certificates with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of certificates',
    type: [CertificateEntity],
  })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.certificateService.findAll(page, limit);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get a certificate by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Certificate found',
    type: CertificateEntity,
  })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CertificateEntity> {
    return this.certificateService.findOne(id);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update a certificate' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Certificate updated successfully',
    type: CertificateEntity,
  })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @Roles(RoleEnum.admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCertificateDto: UpdateCertificateDto,
  ): Promise<CertificateEntity> {
    return this.certificateService.update(id, updateCertificateDto);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a certificate' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Certificate deleted successfully' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.certificateService.remove(id);
  }
}
