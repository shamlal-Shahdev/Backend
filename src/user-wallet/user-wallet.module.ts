import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserWalletEntity } from './entity/user-wallet.entity';
import { UserWalletService } from './user-wallet.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserWalletEntity])],
  providers: [UserWalletService],
  exports: [UserWalletService],
})
export class UserWalletModule {}
