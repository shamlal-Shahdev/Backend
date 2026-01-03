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
  @ApiOperation({ summary: 'Register a new installation' })
  @ApiResponse({
    status: 201,
    description: 'Installation registered successfully',
    type: InstallationEntity,
  })
  @Roles(RoleEnum.user)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createInstallationDto: CreateInstallationDto,
  ): Promise<InstallationEntity> {
    return this.installationService.create(createInstallationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all installations with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of installations',
    type: [InstallationEntity],
  })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.installationService.findAll(page, limit);
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
  @ApiOperation({ summary: 'Delete an installation' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 204,
    description: 'Installation deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Installation not found' })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.installationService.remove(id);
  }
}
