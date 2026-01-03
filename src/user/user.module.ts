import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserEntity } from './entity/user.entity';
import { KycEntity } from '../kyc/entity/kyc.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, KycEntity])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
