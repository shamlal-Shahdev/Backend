import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PredictionEntity } from './entity/prediction.entity';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { UpdatePredictionDto } from './dto/update-prediction.dto';
@Injectable()
export class PredictionService {
  constructor(
    @InjectRepository(PredictionEntity)
    private readonly predictionRepository: Repository<PredictionEntity>,
  ) {}
  async create(
    createPredictionDto: CreatePredictionDto,
  ): Promise<PredictionEntity> {
    const prediction = this.predictionRepository.create(createPredictionDto);
    return await this.predictionRepository.save(prediction);
  }
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<[PredictionEntity[], number]> {
    const [data, total] = await this.predictionRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'installation', 'predictionResult'],
      order: { submittedAt: 'DESC' },
    });
    return [data, total];
  }
  async findOne(id: number): Promise<PredictionEntity> {
    const prediction = await this.predictionRepository.findOne({
      where: { id },
      relations: ['user', 'installation', 'predictionResult'],
    });
    if (!prediction) {
      throw new NotFoundException(`Prediction with ID ${id} not found`);
    }
    return prediction;
  }
  async update(
    id: number,
    updatePredictionDto: UpdatePredictionDto,
  ): Promise<PredictionEntity> {
    const prediction = await this.findOne(id);
    Object.assign(prediction, updatePredictionDto);
    return await this.predictionRepository.save(prediction);
  }
  async remove(id: number): Promise<void> {
    const prediction = await this.findOne(id);
    await this.predictionRepository.remove(prediction);
  }
}
