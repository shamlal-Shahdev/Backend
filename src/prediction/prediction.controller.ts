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
import { PredictionService } from './prediction.service';
import { SubmitPredictionDto } from './dto/submit-prediction.dto';
import { UpdatePredictionDto } from './dto/update-prediction.dto';
import { PredictionEntity } from './entity/prediction.entity';

function parseUserId(req: { user: { id: string | number } }): number {
  return typeof req.user.id === 'string'
    ? parseInt(req.user.id, 10)
    : req.user.id;
}

@ApiTags('Predictions')
@Controller({
  path: 'predictions',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get prediction window status and user eligibility' })
  @Roles(RoleEnum.user)
  getStatus(@Request() req: { user: { id: string | number } }) {
    return this.predictionService.getStatus(parseUserId(req));
  }

  @Get('history')
  @ApiOperation({ summary: 'Get prediction history for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @Roles(RoleEnum.user)
  findHistory(
    @Request() req: { user: { id: string | number } },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.predictionService.findHistory(parseUserId(req), page, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Submit a new prediction for the current month' })
  @ApiResponse({
    status: 201,
    description: 'Prediction submitted successfully',
    type: PredictionEntity,
  })
  @Roles(RoleEnum.user)
  @HttpCode(HttpStatus.CREATED)
  submit(
    @Request() req: { user: { id: string | number } },
    @Body() submitPredictionDto: SubmitPredictionDto,
  ): Promise<PredictionEntity> {
    return this.predictionService.submit(parseUserId(req), submitPredictionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get predictions with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of predictions',
    type: [PredictionEntity],
  })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findAll(
    @Request() req: { user: { id: string | number; role?: string } },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const userId =
      req.user.role === 'admin' ? undefined : parseUserId(req);
    return this.predictionService.findAll(page, limit, userId);
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
  findOne(
    @Request() req: { user: { id: string | number; role?: string } },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PredictionEntity> {
    const userId =
      req.user.role === 'admin' ? undefined : parseUserId(req);
    return this.predictionService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a prediction (admin only, evaluated only)' })
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
