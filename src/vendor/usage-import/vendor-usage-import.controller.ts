import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { VendorGuard } from '../../auth/guards/vendor.guard';
import { VendorCompanyProfileGuard } from '../../auth/guards/vendor-company-profile.guard';
import { VendorUsageImportService } from './vendor-usage-import.service';
import { CreateVendorUsageImportDto } from './dto/create-vendor-usage-import.dto';
import { VendorUsageImportBatchEntity } from './entity/vendor-usage-import-batch.entity';

const uploadLimits = {
  fileSize: 12 * 1024 * 1024,
};

@ApiTags('Vendor - Usage import')
@Controller({ path: 'vendor/usage-imports', version: '1' })
@UseGuards(AuthGuard('jwt'), VendorGuard, VendorCompanyProfileGuard)
@ApiBearerAuth()
export class VendorUsageImportController {
  constructor(private readonly vendorUsageImportService: VendorUsageImportService) {}

  @Get('template.csv')
  @ApiOperation({
    summary: 'Download CSV template (meter_id, total_kwh)',
  })
  async downloadTemplate(@Res() res: Response): Promise<void> {
    const csv = this.vendorUsageImportService.getCsvTemplate();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="wattsup-usage-import-template.csv"',
    );
    res.send(csv);
  }

  @Post()
  @ApiOperation({ summary: 'Upload monthly usage CSV or XLSX' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'periodYearMonth'],
      properties: {
        file: { type: 'string', format: 'binary' },
        periodYearMonth: { type: 'string', example: '2026-04' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Import created and processed' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: uploadLimits,
    }),
  )
  async upload(
    @Request() req: { user: { id: string | number } },
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateVendorUsageImportDto,
  ): Promise<VendorUsageImportBatchEntity> {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    const vendorId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.vendorUsageImportService.createFromUpload(
      vendorId,
      body.periodYearMonth,
      file,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List usage imports for current vendor' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async list(
    @Request() req: { user: { id: string | number } },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const vendorId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.vendorUsageImportService.findAllForVendor(vendorId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get import batch with rows' })
  async getOne(
    @Request() req: { user: { id: string | number } },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<VendorUsageImportBatchEntity> {
    const vendorId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.vendorUsageImportService.findOneForVendor(id, vendorId);
  }
}
