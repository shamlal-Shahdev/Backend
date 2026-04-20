import { Injectable } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { writeFile, mkdir, readFile } from 'fs/promises';
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
    const fileExtension =
      file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const folder = prefix || 'uploads';
    const key = `${folder}/${randomStringGenerator()}.${fileExtension}`;
    const filesDir = join(process.cwd(), 'files');
    const folderDir = join(filesDir, folder);
    const fullFilePath = join(filesDir, key);
    if (!existsSync(filesDir)) {
      await mkdir(filesDir, { recursive: true });
    }
    if (!existsSync(folderDir)) {
      await mkdir(folderDir, { recursive: true });
    }
    if (file.buffer) {
      await writeFile(fullFilePath, file.buffer);
    } else if (file.path) {
    } else {
      throw new Error('File buffer or path is required');
    }
    const fileRecord = await this.fileRepository.create({
      path: key,
    });
    return {
      id: fileRecord.id,
      key: fileRecord.path,
      url: fileRecord.path,
    };
  }
  async readStoredFileByPath(key: string): Promise<Buffer> {
    const fullFilePath = join(process.cwd(), 'files', key);
    return readFile(fullFilePath);
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
