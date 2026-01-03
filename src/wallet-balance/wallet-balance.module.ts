import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletBalanceService } from './wallet-balance.service';
import { WalletBalanceController } from './wallet-balance.controller';
import { WalletBalanceEntity } from './entity/wallet-balance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WalletBalanceEntity])],
  controllers: [WalletBalanceController],
  providers: [WalletBalanceService],
  exports: [WalletBalanceService],
})
export class WalletBalanceModule {}
