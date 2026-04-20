import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminEnergyRequestController } from './energy-request.controller';
import { AdminEnergyRequestService } from './energy-request.service';
import { EnergyRequestEntity } from '../../energy-request/entity/energy-request.entity';
import { UserEntity } from '../../user/entity/user.entity';
import { EmailModule } from '../../email/email.module';
import { BlockchainModule } from '../../blockchain/blockchain.module';
import { WalletBalanceModule } from '../../wallet-balance/wallet-balance.module';
import { UserWalletModule } from '../../user-wallet/user-wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnergyRequestEntity, UserEntity]),
    EmailModule,
    BlockchainModule,
    WalletBalanceModule,
    UserWalletModule,
  ],
  controllers: [AdminEnergyRequestController],
  providers: [AdminEnergyRequestService],
  exports: [AdminEnergyRequestService],
})
export class AdminEnergyRequestModule {}
