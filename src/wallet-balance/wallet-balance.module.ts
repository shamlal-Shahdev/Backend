import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletBalanceService } from './wallet-balance.service';
import { WalletBalanceController } from './wallet-balance.controller';
import { WalletBalanceEntity } from './entity/wallet-balance.entity';
import { UserEntity } from '../user/entity/user.entity';
import { RewardTransactionEntity } from '../reward-transaction/entity/reward-transaction.entity';
import { CouponPurchaseEntity } from '../coupon/entity/coupon-purchase.entity';
import { WithdrawalRequestEntity } from '../coupon/entity/withdrawal-request.entity';
import { EnergyRequestEntity } from '../energy-request/entity/energy-request.entity';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { UserWalletModule } from '../user-wallet/user-wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WalletBalanceEntity,
      UserEntity,
      RewardTransactionEntity,
      CouponPurchaseEntity,
      WithdrawalRequestEntity,
      EnergyRequestEntity,
    ]),
    BlockchainModule,
    UserWalletModule,
  ],
  controllers: [WalletBalanceController],
  providers: [WalletBalanceService],
  exports: [WalletBalanceService],
})
export class WalletBalanceModule {}
