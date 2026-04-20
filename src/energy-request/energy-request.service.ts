import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnergyRequestEntity } from './entity/energy-request.entity';

@Injectable()
export class EnergyRequestService {
  private readonly logger = new Logger(EnergyRequestService.name);

  constructor(
    @InjectRepository(EnergyRequestEntity)
    private readonly energyRequestRepository: Repository<EnergyRequestEntity>,
  ) {}

  async getUserEnergyRequestStatus(userId: number): Promise<{
    requests: EnergyRequestEntity[];
    total: number;
  }> {
    this.logger.log(`Getting energy request status for user ${userId}`);
    const requests = await this.energyRequestRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return {
      requests,
      total: requests.length,
    };
  }

  async getUserEnergyRequestById(
    userId: number,
    requestId: number,
  ): Promise<EnergyRequestEntity> {
    const request = await this.energyRequestRepository.findOne({
      where: { id: requestId, userId },
      relations: ['user'],
    });
    if (!request) {
      throw new NotFoundException('Energy request not found');
    }
    return request;
  }
}
