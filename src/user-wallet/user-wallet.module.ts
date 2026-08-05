import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserWalletEntity } from './entity/user-wallet.entity';
import { UserWalletService } from './user-wallet.service';
import { UserWalletController } from './user-wallet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserWalletEntity])],
  controllers: [UserWalletController],
  providers: [UserWalletService],
  exports: [UserWalletService],
})
export class UserWalletModule {}

