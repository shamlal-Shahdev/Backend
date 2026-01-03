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
import { PredictionService } from './prediction.service';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { UpdatePredictionDto } from './dto/update-prediction.dto';
import { PredictionEntity } from './entity/prediction.entity';

@ApiTags('Predictions')
@Controller({
  path: 'predictions',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new prediction' })
  @ApiResponse({
    status: 201,
    description: 'Prediction submitted successfully',
    type: PredictionEntity,
  })
  @Roles(RoleEnum.user)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createPredictionDto: CreatePredictionDto,
  ): Promise<PredictionEntity> {
    return this.predictionService.create(createPredictionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all predictions with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of predictions',
    type: [PredictionEntity],
  })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.predictionService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a prediction by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Prediction found',
    type: PredictionEntity,
  })
  @ApiResponse({ status: 404, description: 'Prediction not found' })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PredictionEntity> {
    return this.predictionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a prediction' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Prediction updated successfully',
    type: PredictionEntity,
  })
  @ApiResponse({ status: 404, description: 'Prediction not found' })
  @Roles(RoleEnum.admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePredictionDto: UpdatePredictionDto,
  ): Promise<PredictionEntity> {
    return this.predictionService.update(id, updatePredictionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a prediction' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Prediction deleted successfully' })
  @ApiResponse({ status: 404, description: 'Prediction not found' })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.predictionService.remove(id);
  }
}
