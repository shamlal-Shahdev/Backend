import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserEntity } from './entity/user.entity';
import { KycEntity } from '../kyc/entity/kyc.entity';
import { DashboardService } from './dashboard.service';
import { EnergyReadingEntity } from '../energy-reading/entity/energy-reading.entity';
import { WalletBalanceEntity } from '../wallet-balance/entity/wallet-balance.entity';
import { CertificateEntity } from '../certificate/entity/certificate.entity';
import { RewardTransactionEntity } from '../reward-transaction/entity/reward-transaction.entity';
import { PredictionEntity } from '../prediction/entity/prediction.entity';
import { InstallationEntity } from '../installation/entity/installation.entity';
import { UserCarbonMetricsService } from './user-carbon-metrics.service';
import { CertificateModule } from '../certificate/certificate.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      KycEntity,
      EnergyReadingEntity,
      WalletBalanceEntity,
      CertificateEntity,
      RewardTransactionEntity,
      PredictionEntity,
      InstallationEntity,
    ]),
    forwardRef(() => CertificateModule),
  ],
  controllers: [UserController],
  providers: [UserService, DashboardService, UserCarbonMetricsService],
  exports: [UserService, DashboardService, UserCarbonMetricsService],
})
export class UserModule {}
