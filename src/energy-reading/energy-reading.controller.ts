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
import { EnergyReadingService } from './energy-reading.service';
import { CreateEnergyReadingDto } from './dto/create-energy-reading.dto';
import { UpdateEnergyReadingDto } from './dto/update-energy-reading.dto';
import { EnergyReadingEntity } from './entity/energy-reading.entity';

@ApiTags('Energy Readings')
@Controller({
  path: 'energy-readings',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class EnergyReadingController {
  constructor(private readonly energyReadingService: EnergyReadingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new energy reading' })
  @ApiResponse({
    status: 201,
    description: 'Energy reading created successfully',
    type: EnergyReadingEntity,
  })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createEnergyReadingDto: CreateEnergyReadingDto,
  ): Promise<EnergyReadingEntity> {
    return this.energyReadingService.create(createEnergyReadingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all energy readings with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of energy readings',
    type: [EnergyReadingEntity],
  })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.energyReadingService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an energy reading by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Energy reading found',
    type: EnergyReadingEntity,
  })
  @ApiResponse({ status: 404, description: 'Energy reading not found' })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<EnergyReadingEntity> {
    return this.energyReadingService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an energy reading' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Energy reading updated successfully',
    type: EnergyReadingEntity,
  })
  @ApiResponse({ status: 404, description: 'Energy reading not found' })
  @Roles(RoleEnum.admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEnergyReadingDto: UpdateEnergyReadingDto,
  ): Promise<EnergyReadingEntity> {
    return this.energyReadingService.update(id, updateEnergyReadingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an energy reading' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 204,
    description: 'Energy reading deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Energy reading not found' })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.energyReadingService.remove(id);
  }
}
