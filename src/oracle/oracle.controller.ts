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
import { OracleService } from './oracle.service';
import { CreateOracleDto } from './dto/create-oracle.dto';
import { UpdateOracleDto } from './dto/update-oracle.dto';
import { OracleEntity } from './entity/oracle.entity';

@ApiTags('Oracles')
@Controller({
  path: 'oracles',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class OracleController {
  constructor(private readonly oracleService: OracleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new oracle' })
  @ApiResponse({
    status: 201,
    description: 'Oracle created successfully',
    type: OracleEntity,
  })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createOracleDto: CreateOracleDto): Promise<OracleEntity> {
    return this.oracleService.create(createOracleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all oracles with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of oracles',
    type: [OracleEntity],
  })
  @Roles(RoleEnum.admin)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.oracleService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an oracle by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Oracle found', type: OracleEntity })
  @ApiResponse({ status: 404, description: 'Oracle not found' })
  @Roles(RoleEnum.admin)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<OracleEntity> {
    return this.oracleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an oracle' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Oracle updated successfully',
    type: OracleEntity,
  })
  @ApiResponse({ status: 404, description: 'Oracle not found' })
  @Roles(RoleEnum.admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOracleDto: UpdateOracleDto,
  ): Promise<OracleEntity> {
    return this.oracleService.update(id, updateOracleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an oracle' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Oracle deleted successfully' })
  @ApiResponse({ status: 404, description: 'Oracle not found' })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.oracleService.remove(id);
  }
}
