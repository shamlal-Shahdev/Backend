import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUsersController } from './users.controller';
import { AdminUsersService } from './users.service';
import { UserEntity } from '../../user/entity/user.entity';
import { KycEntity } from '../../kyc/entity/kyc.entity';
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, KycEntity])],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}
