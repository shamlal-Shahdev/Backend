import {
  Controller,
  Get,
  UseGuards,
  Request,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EnergyRequestService } from './energy-request.service';
import { EnergyRequestResponseDto } from './dto/energy-request-response.dto';
import { EnergyRequestEntity } from './entity/energy-request.entity';

@ApiTags('Energy Generation Requests')
@Controller({
  path: 'energy',
  version: '1',
})
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class EnergyRequestController {
  constructor(private readonly energyRequestService: EnergyRequestService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Get current user energy request status',
    description:
      'Meter readings are recorded automatically; this lists existing verification requests if any.',
  })
  @ApiResponse({
    status: 200,
    description: 'Energy request status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        requests: {
          type: 'array',
          items: { $ref: '#/components/schemas/EnergyRequestResponseDto' },
        },
        total: { type: 'number' },
      },
    },
  })
  async getEnergyRequestStatus(@Request() req): Promise<{
    requests: EnergyRequestEntity[];
    total: number;
  }> {
    const userId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.energyRequestService.getUserEnergyRequestStatus(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific energy request by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Energy request ID' })
  @ApiResponse({
    status: 200,
    description: 'Energy request retrieved successfully',
    type: EnergyRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Energy request not found' })
  async getEnergyRequestById(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EnergyRequestResponseDto> {
    const userId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.energyRequestService.getUserEnergyRequestById(userId, id);
  }
}
