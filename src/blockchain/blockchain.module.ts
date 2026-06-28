import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TokenService } from './token.service';
import { BlockchainController } from './blockchain.controller';
import { WalletService } from './wallet.service';
import { UserModule } from '../user/user.module';
import { UserWalletModule } from '../user-wallet/user-wallet.module';

@Module({
  imports: [ConfigModule, UserModule, UserWalletModule],
  providers: [TokenService, WalletService],
  controllers: [BlockchainController],
  exports: [TokenService, WalletService],
})
export class BlockchainModule {}
