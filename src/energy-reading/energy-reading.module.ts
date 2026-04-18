import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyReadingService } from './energy-reading.service';
import { EnergyReadingController } from './energy-reading.controller';
import { EnergyReadingEntity } from './entity/energy-reading.entity';
@Module({
  imports: [TypeOrmModule.forFeature([EnergyReadingEntity])],
  controllers: [EnergyReadingController],
  providers: [EnergyReadingService],
  exports: [EnergyReadingService],
})
export class EnergyReadingModule {}
