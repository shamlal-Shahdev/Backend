import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OracleEntity } from './entity/oracle.entity';
import { CreateOracleDto } from './dto/create-oracle.dto';
import { UpdateOracleDto } from './dto/update-oracle.dto';

@Injectable()
export class OracleService {
  constructor(
    @InjectRepository(OracleEntity)
    private readonly oracleRepository: Repository<OracleEntity>,
  ) {}

  async create(createOracleDto: CreateOracleDto): Promise<OracleEntity> {
    const oracle = this.oracleRepository.create(createOracleDto);
    return await this.oracleRepository.save(oracle);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<[OracleEntity[], number]> {
    const [data, total] = await this.oracleRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return [data, total];
  }

  async findOne(id: number): Promise<OracleEntity> {
    const oracle = await this.oracleRepository.findOne({
      where: { id },
    });

    if (!oracle) {
      throw new NotFoundException(`Oracle with ID ${id} not found`);
    }

    return oracle;
  }

  async update(
    id: number,
    updateOracleDto: UpdateOracleDto,
  ): Promise<OracleEntity> {
    const oracle = await this.findOne(id);
    Object.assign(oracle, updateOracleDto);
    return await this.oracleRepository.save(oracle);
  }

  async remove(id: number): Promise<void> {
    const oracle = await this.findOne(id);
    await this.oracleRepository.remove(oracle);
  }
}
