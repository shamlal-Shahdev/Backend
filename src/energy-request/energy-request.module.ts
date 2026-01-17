import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyRequestController } from './energy-request.controller';
import { EnergyRequestService } from './energy-request.service';
import { EnergyRequestEntity } from './entity/energy-request.entity';
import { UserEntity } from '../user/entity/user.entity';
import { FilesModule } from '../files/files.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnergyRequestEntity, UserEntity]),
    FilesModule,
    EmailModule,
  ],
  controllers: [EnergyRequestController],
  providers: [EnergyRequestService],
  exports: [EnergyRequestService],
})
export class EnergyRequestModule {}

