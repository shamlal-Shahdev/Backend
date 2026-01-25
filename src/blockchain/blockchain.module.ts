// src/blockchain/blockchain.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TokenService } from './token.service';
import { BlockchainController } from './blockchain.controller';
import { WalletService } from './wallet.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ConfigModule, UserModule],
  providers: [TokenService, WalletService],
  controllers: [BlockchainController],
  exports: [TokenService, WalletService],
})
export class BlockchainModule {}