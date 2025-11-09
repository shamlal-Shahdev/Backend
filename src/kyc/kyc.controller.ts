import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { KycService } from './kyc.service';
import { ResubmitKycDto } from './dto/resubmit-kyc.dto';
import { UpdateUserKycDto } from './dto/update-user-kyc.dto';

@ApiTags('KYC')
@Controller({
  path: 'kyc',
  version: '1',
})
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get KYC status' })
  @ApiResponse({ status: 200, description: 'KYC status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'KYC record not found' })
  async getKycStatus(@Request() req) {
    return this.kycService.getKycStatus(req.user.id);
  }

  @Post('resubmit')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cnicFront', maxCount: 1 },
      { name: 'cnicBack', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Resubmit KYC documents' })
  @ApiResponse({ status: 200, description: 'KYC resubmitted successfully' })
  @ApiResponse({ status: 400, description: 'Can only resubmit rejected applications' })
  @ApiResponse({ status: 404, description: 'KYC record not found' })
  async resubmitKyc(
    @Request() req,
    @Body() dto: ResubmitKycDto,
    @UploadedFiles()
    files: {
      cnicFront?: Express.Multer.File[];
      cnicBack?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
  ) {
    return this.kycService.resubmitKyc(req.user.id, dto, files);
  }

  @Put('update')
  @ApiOperation({ summary: 'Update KYC information' })
  @ApiResponse({ status: 200, description: 'KYC information updated successfully' })
  @ApiResponse({ status: 404, description: 'KYC record not found' })
  async updateKyc(@Request() req, @Body() dto: UpdateUserKycDto) {
    return this.kycService.updateUserKyc(req.user.id, dto);
  }
}

