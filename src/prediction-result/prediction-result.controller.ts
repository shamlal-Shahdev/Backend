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
import { PredictionResultService } from './prediction-result.service';
import { CreatePredictionResultDto } from './dto/create-prediction-result.dto';
import { UpdatePredictionResultDto } from './dto/update-prediction-result.dto';
import { PredictionResultEntity } from './entity/prediction-result.entity';

@ApiTags('Prediction Results')
@Controller({
  path: 'prediction-results',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class PredictionResultController {
  constructor(
    private readonly predictionResultService: PredictionResultService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new prediction result' })
  @ApiResponse({
    status: 201,
    description: 'Prediction result created successfully',
    type: PredictionResultEntity,
  })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createPredictionResultDto: CreatePredictionResultDto,
  ): Promise<PredictionResultEntity> {
    return this.predictionResultService.create(createPredictionResultDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all prediction results with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of prediction results',
    type: [PredictionResultEntity],
  })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.predictionResultService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a prediction result by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Prediction result found',
    type: PredictionResultEntity,
  })
  @ApiResponse({ status: 404, description: 'Prediction result not found' })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PredictionResultEntity> {
    return this.predictionResultService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a prediction result' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Prediction result updated successfully',
    type: PredictionResultEntity,
  })
  @ApiResponse({ status: 404, description: 'Prediction result not found' })
  @Roles(RoleEnum.admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePredictionResultDto: UpdatePredictionResultDto,
  ): Promise<PredictionResultEntity> {
    return this.predictionResultService.update(id, updatePredictionResultDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a prediction result' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 204,
    description: 'Prediction result deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Prediction result not found' })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.predictionResultService.remove(id);
  }
}
