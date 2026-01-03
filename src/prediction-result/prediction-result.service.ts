import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PredictionResultEntity } from './entity/prediction-result.entity';
import { CreatePredictionResultDto } from './dto/create-prediction-result.dto';
import { UpdatePredictionResultDto } from './dto/update-prediction-result.dto';

@Injectable()
export class PredictionResultService {
  constructor(
    @InjectRepository(PredictionResultEntity)
    private readonly predictionResultRepository: Repository<PredictionResultEntity>,
  ) {}

  async create(
    createPredictionResultDto: CreatePredictionResultDto,
  ): Promise<PredictionResultEntity> {
    const existingResult = await this.predictionResultRepository.findOne({
      where: { prediction: { id: createPredictionResultDto.predictionId } },
    });

    if (existingResult) {
      throw new ConflictException(
        'Prediction result for this prediction already exists',
      );
    }

    const predictionResult = this.predictionResultRepository.create(
      createPredictionResultDto,
    );
    return await this.predictionResultRepository.save(predictionResult);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<[PredictionResultEntity[], number]> {
    const [data, total] = await this.predictionResultRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['prediction'],
      order: { evaluatedAt: 'DESC' },
    });
    return [data, total];
  }

  async findOne(id: number): Promise<PredictionResultEntity> {
    const predictionResult = await this.predictionResultRepository.findOne({
      where: { id },
      relations: ['prediction'],
    });

    if (!predictionResult) {
      throw new NotFoundException(`Prediction Result with ID ${id} not found`);
    }

    return predictionResult;
  }

  async update(
    id: number,
    updatePredictionResultDto: UpdatePredictionResultDto,
  ): Promise<PredictionResultEntity> {
    const predictionResult = await this.findOne(id);

    if (updatePredictionResultDto.predictionId) {
      const existingResult = await this.predictionResultRepository.findOne({
        where: { prediction: { id: updatePredictionResultDto.predictionId } },
      });

      if (existingResult && existingResult.id !== id) {
        throw new ConflictException(
          'Prediction result for this prediction already exists',
        );
      }
    }

    Object.assign(predictionResult, updatePredictionResultDto);
    return await this.predictionResultRepository.save(predictionResult);
  }

  async remove(id: number): Promise<void> {
    const predictionResult = await this.findOne(id);
    await this.predictionResultRepository.remove(predictionResult);
  }
}
