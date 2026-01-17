import { Injectable } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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
    prefix?: string,
  ): Promise<{ id: string; key: string; url: string }> {
    // Generate a unique key for the file
    const fileExtension =
      file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const folder = prefix || 'uploads';
    const key = `${folder}/${randomStringGenerator()}.${fileExtension}`;

    // Construct the full file path
    const filesDir = join(process.cwd(), 'files');
    const folderDir = join(filesDir, folder);
    const fullFilePath = join(filesDir, key);

    // Create the files directory if it doesn't exist
    if (!existsSync(filesDir)) {
      await mkdir(filesDir, { recursive: true });
    }

    // Create the folder directory if it doesn't exist
    if (!existsSync(folderDir)) {
      await mkdir(folderDir, { recursive: true });
    }

    // Write the file to disk
    // file.buffer is available when using memoryStorage()
    // file.path is available when using diskStorage()
    if (file.buffer) {
      // File is in memory (from memoryStorage)
      await writeFile(fullFilePath, file.buffer);
    } else if (file.path) {
      // File was already saved to disk (from diskStorage)
      // No need to write again, but we might need to move it
      // For now, we'll assume the file is already at the correct location
    } else {
      throw new Error('File buffer or path is required');
    }

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
