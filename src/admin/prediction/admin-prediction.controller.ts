import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { PredictionService } from '../../prediction/prediction.service';

@ApiTags('Admin - Predictions')
@Controller({
  path: 'admin/predictions',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), AdminGuard)
@ApiBearerAuth()
export class AdminPredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Get()
  @ApiOperation({ summary: 'List all predictions (read-only monitoring)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 25 })
  @ApiResponse({ status: 200, description: 'Predictions retrieved successfully' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
  ) {
    return this.predictionService.findAll(page, limit);
  }
}
