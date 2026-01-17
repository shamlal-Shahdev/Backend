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
    // Get the full path from the request URL
    // Remove the base path: /api/v1/files/
    const url = request.url;
    const basePath = '/api/v1/files/';
    let filePath = url.replace(basePath, '');

    // If versioning is in the path, handle it
    if (filePath.startsWith('v1/')) {
      filePath = filePath.replace('v1/', '');
    }

    // Decode the path in case it's URL encoded
    const decodedPath = decodeURIComponent(filePath);

    // Construct the full file path
    const fullFilePath = join(process.cwd(), 'files', decodedPath);

    // Check if file exists
    if (!existsSync(fullFilePath)) {
      response
        .status(404)
        .json({ message: 'File not found', path: decodedPath });
      return;
    }

    // Set appropriate content type for images
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

    // Set CORS headers explicitly
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET');

    // Send the file - don't return the response to avoid serialization issues
    response.sendFile(fullFilePath, (err) => {
      if (err) {
        if (!response.headersSent) {
          response.status(500).json({ message: 'Error serving file', error: err.message });
        }
      }
    });
  }
}
