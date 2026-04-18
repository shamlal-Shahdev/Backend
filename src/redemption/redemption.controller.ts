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
import { RedemptionService } from './redemption.service';
import { CreateRedemptionDto } from './dto/create-redemption.dto';
import { UpdateRedemptionDto } from './dto/update-redemption.dto';
import { RedemptionEntity } from './entity/redemption.entity';
@ApiTags('Redemptions')
@Controller({
  path: 'redemptions',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class RedemptionController {
  constructor(private readonly redemptionService: RedemptionService) {}
  @Post()
  @ApiOperation({ summary: 'Create a new redemption' })
  @ApiResponse({
    status: 201,
    description: 'Redemption created successfully',
    type: RedemptionEntity,
  })
  @Roles(RoleEnum.user)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createRedemptionDto: CreateRedemptionDto,
  ): Promise<RedemptionEntity> {
    return this.redemptionService.create(createRedemptionDto);
  }
  @Get()
  @ApiOperation({ summary: 'Get all redemptions with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of redemptions',
    type: [RedemptionEntity],
  })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.redemptionService.findAll(page, limit);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get a redemption by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Redemption found',
    type: RedemptionEntity,
  })
  @ApiResponse({ status: 404, description: 'Redemption not found' })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<RedemptionEntity> {
    return this.redemptionService.findOne(id);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update a redemption (complete/cancel)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Redemption updated successfully',
    type: RedemptionEntity,
  })
  @ApiResponse({ status: 404, description: 'Redemption not found' })
  @Roles(RoleEnum.admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRedemptionDto: UpdateRedemptionDto,
  ): Promise<RedemptionEntity> {
    return this.redemptionService.update(id, updateRedemptionDto);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a redemption' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Redemption deleted successfully' })
  @ApiResponse({ status: 404, description: 'Redemption not found' })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.redemptionService.remove(id);
  }
}
