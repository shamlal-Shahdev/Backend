import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminKycController } from './kyc.controller';
import { AdminKycService } from './kyc.service';
import { UserEntity } from '../../user/entity/user.entity';
import { KycEntity } from '../../kyc/entity/kyc.entity';
import { EmailModule } from '../../email/email.module';
import { BlockchainModule } from '../../blockchain/blockchain.module';
import { WalletBalanceModule } from '../../wallet-balance/wallet-balance.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, KycEntity]),
    EmailModule,
    BlockchainModule,
    WalletBalanceModule,
  ],
  controllers: [AdminKycController],
  providers: [AdminKycService],
  exports: [AdminKycService],
})
export class AdminKycModule {}
