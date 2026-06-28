import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponEntity } from './entity/coupon.entity';
import { CouponPurchaseEntity } from './entity/coupon-purchase.entity';
import { WithdrawalRequestEntity } from './entity/withdrawal-request.entity';
import { CouponService } from './coupon.service';
import { MarketplaceController } from './marketplace.controller';
import { CouponController, UserCouponController } from './coupon.controller';
import { WalletBalanceModule } from '../wallet-balance/wallet-balance.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { UserWalletModule } from '../user-wallet/user-wallet.module';
import { VendorCompanyProfileEntity } from '../vendor/company-profile/entity/vendor-company-profile.entity';
import { UserEntity } from '../user/entity/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CouponEntity,
      CouponPurchaseEntity,
      WithdrawalRequestEntity,
      VendorCompanyProfileEntity,
      UserEntity,
    ]),
    WalletBalanceModule,
    BlockchainModule,
    UserWalletModule,
  ],
  controllers: [MarketplaceController, CouponController, UserCouponController],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponModule {}
