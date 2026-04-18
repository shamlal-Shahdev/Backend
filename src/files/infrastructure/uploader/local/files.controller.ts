import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Header,
  Res,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FilesLocalService } from './files.service';
import { FileResponseDto } from './dto/file-response.dto';
import { join } from 'path';
import { existsSync } from 'fs';
@ApiTags('Files')
@Controller({
  path: 'files',
  version: '1',
})
export class FilesLocalController {
  constructor(private readonly filesService: FilesLocalService) {}
  @ApiCreatedResponse({
    type: FileResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FileResponseDto> {
    return this.filesService.create(file);
  }
  @Get('*')
  @ApiExcludeEndpoint()
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'GET')
  @Header('Access-Control-Allow-Headers', 'Content-Type')
  download(@Req() request: any, @Res() response): void {
    const url = request.url;
    const basePath = '/api/v1/files/';
    let filePath = url.replace(basePath, '');
    if (filePath.startsWith('v1/')) {
      filePath = filePath.replace('v1/', '');
    }
    const decodedPath = decodeURIComponent(filePath);
    const fullFilePath = join(process.cwd(), 'files', decodedPath);
    if (!existsSync(fullFilePath)) {
      response
        .status(404)
        .json({ message: 'File not found', path: decodedPath });
      return;
    }
    const ext = decodedPath.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
      webp: 'image/webp',
    };
    if (ext && contentTypes[ext]) {
      response.setHeader('Content-Type', contentTypes[ext]);
    }
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET');
    response.sendFile(fullFilePath, (err) => {
      if (err) {
        if (!response.headersSent) {
          response.status(500).json({ message: 'Error serving file', error: err.message });
        }
      }
    });
  }
}
