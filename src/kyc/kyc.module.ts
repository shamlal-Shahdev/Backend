import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { KycEntity } from './entity/kyc.entity';
import { UserEntity } from '../user/entity/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([KycEntity, UserEntity])],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
