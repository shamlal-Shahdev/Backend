import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletBalanceService } from './wallet-balance.service';
import { WalletBalanceController } from './wallet-balance.controller';
import { WalletBalanceEntity } from './entity/wallet-balance.entity';
import { UserEntity } from '../user/entity/user.entity';
import { BlockchainModule } from '../blockchain/blockchain.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([WalletBalanceEntity, UserEntity]),
    BlockchainModule,
  ],
  controllers: [WalletBalanceController],
  providers: [WalletBalanceService],
  exports: [WalletBalanceService],
})
export class WalletBalanceModule {}
