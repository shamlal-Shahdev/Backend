import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminEnergyRequestController } from './energy-request.controller';
import { AdminEnergyRequestService } from './energy-request.service';
import { EnergyRequestEntity } from '../../energy-request/entity/energy-request.entity';
import { UserEntity } from '../../user/entity/user.entity';
import { KycEntity } from '../../kyc/entity/kyc.entity';
import { EmailModule } from '../../email/email.module';
import { BlockchainModule } from '../../blockchain/blockchain.module';
import { WalletBalanceModule } from '../../wallet-balance/wallet-balance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnergyRequestEntity, UserEntity, KycEntity]),
    EmailModule,
    BlockchainModule,
    WalletBalanceModule,
  ],
  controllers: [AdminEnergyRequestController],
  providers: [AdminEnergyRequestService],
  exports: [AdminEnergyRequestService],
})
export class AdminEnergyRequestModule {}

