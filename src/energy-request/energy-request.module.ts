import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyRequestController } from './energy-request.controller';
import { EnergyRequestService } from './energy-request.service';
import { EnergyRequestEntity } from './entity/energy-request.entity';
import { UserEntity } from '../user/entity/user.entity';
import { KycEntity } from '../kyc/entity/kyc.entity';
import { FilesModule } from '../files/files.module';
import { EmailModule } from '../email/email.module';
import { MeterOcrService } from './meter-ocr.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([EnergyRequestEntity, UserEntity, KycEntity]),
    FilesModule,
    EmailModule,
  ],
  controllers: [EnergyRequestController],
  providers: [EnergyRequestService, MeterOcrService],
  exports: [EnergyRequestService],
})
export class EnergyRequestModule {}
