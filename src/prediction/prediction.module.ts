import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictionService } from './prediction.service';
import { PredictionEvaluationService } from './prediction-evaluation.service';
import { PredictionController } from './prediction.controller';
import { PredictionEntity } from './entity/prediction.entity';
import { PredictionResultEntity } from '../prediction-result/entity/prediction-result.entity';
import { InstallationEntity } from '../installation/entity/installation.entity';
import { RewardTransactionEntity } from '../reward-transaction/entity/reward-transaction.entity';
import { TokenMintEventEntity } from '../token-mint-event/entity/token-mint-event.entity';
import { WalletBalanceEntity } from '../wallet-balance/entity/wallet-balance.entity';
import { KycModule } from '../kyc/kyc.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { UserWalletModule } from '../user-wallet/user-wallet.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PredictionEntity,
      PredictionResultEntity,
      InstallationEntity,
      RewardTransactionEntity,
      TokenMintEventEntity,
      WalletBalanceEntity,
    ]),
    KycModule,
    BlockchainModule,
    UserWalletModule,
    EmailModule,
  ],
  controllers: [PredictionController],
  providers: [PredictionService, PredictionEvaluationService],
  exports: [PredictionService, PredictionEvaluationService],
})
export class PredictionModule {}
