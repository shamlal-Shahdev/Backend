import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity } from '../entities/document.entity';

@Injectable()
export class DocumentRepository {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly repository: Repository<DocumentEntity>,
  ) {}

  async create(data: Partial<DocumentEntity>): Promise<DocumentEntity> {
    const document = this.repository.create(data);
    return this.repository.save(document);
  }

  async createMany(data: Partial<DocumentEntity>[]): Promise<DocumentEntity[]> {
    const documents = this.repository.create(data);
    return this.repository.save(documents);
  }

  async findByKycId(kycId: string): Promise<DocumentEntity[]> {
    return this.repository.find({ where: { kycId } });
  }

  async findOne(id: string): Promise<DocumentEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<DocumentEntity>): Promise<DocumentEntity | null> {
    await this.repository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}

