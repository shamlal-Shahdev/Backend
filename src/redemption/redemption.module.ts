import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedemptionService } from './redemption.service';
import { RedemptionController } from './redemption.controller';
import { RedemptionEntity } from './entity/redemption.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RedemptionEntity])],
  controllers: [RedemptionController],
  providers: [RedemptionService],
  exports: [RedemptionService],
})
export class RedemptionModule {}
