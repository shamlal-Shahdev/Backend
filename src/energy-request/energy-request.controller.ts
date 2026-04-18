import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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
  @Post('upload')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) 
  @ApiOperation({ summary: 'Upload smart meter image for energy generation verification' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'month', 'year'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Smart meter image (JPG/PNG, max 5MB)',
        },
        month: {
          type: 'integer',
          example: 1,
          description: 'Month (1-12)',
        },
        year: {
          type: 'integer',
          example: 2024,
          description: 'Year',
        },
        meterIdFromImage: {
          type: 'string',
          example: 'METER123456',
          description: 'Meter ID extracted from image (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Energy request uploaded successfully',
    type: EnergyRequestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (month/year out of range, file missing)',
  })
  @ApiResponse({
    status: 409,
    description: 'Request already exists for this month/year',
  })
  @ApiResponse({
    status: 422,
    description: 'Invalid file type or size',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), 
      limits: {
        fileSize: 5 * 1024 * 1024, 
      },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async uploadEnergyRequest(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<EnergyRequestResponseDto> {
    const userId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    if (!file) {
      throw new BadRequestException('Meter image file is required');
    }
    const month = parseInt(req.body?.month, 10);
    const year = parseInt(req.body?.year, 10);
    const meterIdFromImage = req.body?.meterIdFromImage || undefined;
    if (!month || !year || isNaN(month) || isNaN(year)) {
      throw new BadRequestException('Month and year are required and must be valid numbers');
    }
    const request = await this.energyRequestService.uploadEnergyRequest(
      userId,
      file,
      month,
      year,
      meterIdFromImage,
    );
    return request;
  }
  @Get('status')
  @ApiOperation({ summary: 'Get current user energy request status' })
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
