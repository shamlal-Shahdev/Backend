import { Injectable } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';

import { FileRepository } from './infrastructure/persistence/file.repository';
import { FileType } from './domain/file';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class FilesService {
  constructor(private readonly fileRepository: FileRepository) {}

  findById(id: FileType['id']): Promise<NullableType<FileType>> {
    return this.fileRepository.findById(id);
  }

  findByIds(ids: FileType['id'][]): Promise<FileType[]> {
    return this.fileRepository.findByIds(ids);
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ id: string; key: string; url: string }> {
    // Generate a unique key for the file
    const fileExtension =
      file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `kyc/${randomStringGenerator()}.${fileExtension}`;

    // Create file record in database
    const fileRecord = await this.fileRepository.create({
      path: key,
    });

    // Return the file id, key and URL
    // The URL will be the path that can be used to retrieve the file
    return {
      id: fileRecord.id,
      key: fileRecord.path,
      url: fileRecord.path,
    };
  }

  async create(file: Express.Multer.File): Promise<FileType> {
    const fileExtension =
      file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `uploads/${randomStringGenerator()}.${fileExtension}`;

    return this.fileRepository.create({
      path: key,
    });
  }
}
