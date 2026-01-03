import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CertificateEntity } from './entity/certificate.entity';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';

@Injectable()
export class CertificateService {
  constructor(
    @InjectRepository(CertificateEntity)
    private readonly certificateRepository: Repository<CertificateEntity>,
  ) {}

  async create(
    createCertificateDto: CreateCertificateDto,
  ): Promise<CertificateEntity> {
    const certificate = this.certificateRepository.create(createCertificateDto);
    return await this.certificateRepository.save(certificate);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<[CertificateEntity[], number]> {
    const [data, total] = await this.certificateRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'installation'],
      order: { generatedAt: 'DESC' },
    });
    return [data, total];
  }

  async findOne(id: number): Promise<CertificateEntity> {
    const certificate = await this.certificateRepository.findOne({
      where: { id },
      relations: ['user', 'installation'],
    });

    if (!certificate) {
      throw new NotFoundException(`Certificate with ID ${id} not found`);
    }

    return certificate;
  }

  async update(
    id: number,
    updateCertificateDto: UpdateCertificateDto,
  ): Promise<CertificateEntity> {
    const certificate = await this.findOne(id);
    Object.assign(certificate, updateCertificateDto);
    return await this.certificateRepository.save(certificate);
  }

  async remove(id: number): Promise<void> {
    const certificate = await this.findOne(id);
    await this.certificateRepository.remove(certificate);
  }
}
