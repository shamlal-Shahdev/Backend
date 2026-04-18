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
import { InstallationService } from './installation.service';
import { CreateInstallationDto } from './dto/create-installation.dto';
import { UpdateInstallationDto } from './dto/update-installation.dto';
import { InstallationEntity } from './entity/installation.entity';
@ApiTags('Installations')
@Controller({
  path: 'installations',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class InstallationController {
  constructor(private readonly installationService: InstallationService) {}
  @Post()
  @ApiOperation({ summary: 'Submit installation request' })
  @ApiResponse({
    status: 201,
    description: 'Installation request submitted successfully',
    type: InstallationEntity,
  })
  @Roles(RoleEnum.user)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() createInstallationDto: CreateInstallationDto,
  ): Promise<InstallationEntity> {
    const userId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.installationService.create({
      ...createInstallationDto,
      userId,
    });
  }
  @Get()
  @ApiOperation({ summary: 'Get installations with pagination (filtered by user for regular users)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of installations',
    type: [InstallationEntity],
  })
  @Roles(RoleEnum.admin, RoleEnum.user)
  async findAll(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const userId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    const userRole = req.user.role;
    if (userRole !== 'admin') {
      return this.installationService.findByUserId(userId, page, limit);
    }
    const [data, total] = await this.installationService.findAll(page, limit);
    return {
      data,
      total,
      page,
      limit,
    };
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get an installation by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Installation found',
    type: InstallationEntity,
  })
  @ApiResponse({ status: 404, description: 'Installation not found' })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<InstallationEntity> {
    return this.installationService.findOne(id);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update an installation' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Installation updated successfully',
    type: InstallationEntity,
  })
  @ApiResponse({ status: 404, description: 'Installation not found' })
  @Roles(RoleEnum.admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInstallationDto: UpdateInstallationDto,
  ): Promise<InstallationEntity> {
    return this.installationService.update(id, updateInstallationDto);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Cancel/Delete an installation (users can cancel SUBMITTED, admin can delete any)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 204,
    description: 'Installation cancelled/deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Installation not found' })
  @ApiResponse({ status: 400, description: 'Cannot cancel - installation status is not SUBMITTED' })
  @Roles(RoleEnum.admin, RoleEnum.user)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const userId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    const userRole = req.user.role;
    if (userRole !== 'admin') {
      return this.installationService.cancelInstallation(id, userId);
    }
    return this.installationService.remove(id);
  }
  @Get('user/installations')
  @ApiOperation({ summary: 'Get all installations for a user' })
  @ApiResponse({
    status: 200,
    description: 'Installations retrieved successfully',
    type: [InstallationEntity],
  })
  @Roles(RoleEnum.user)
  async getUserInstallations(@Request() req): Promise<InstallationEntity[]> {
    const userId = typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.installationService.getUserInstallations(userId);
  }
}
