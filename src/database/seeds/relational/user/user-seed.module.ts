import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSeedService } from './user-seed.service';
import { UserEntity } from '../../../../user/entity/user.entity';
import { UserWalletEntity } from '../../../../user-wallet/entity/user-wallet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserWalletEntity])],
  providers: [UserSeedService],
  exports: [UserSeedService],
})
export class UserSeedModule {}
