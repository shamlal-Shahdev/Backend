import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyRequestController } from './energy-request.controller';
import { EnergyRequestService } from './energy-request.service';
import { EnergyRequestEntity } from './entity/energy-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EnergyRequestEntity])],
  controllers: [EnergyRequestController],
  providers: [EnergyRequestService],
  exports: [EnergyRequestService],
})
export class EnergyRequestModule {}
