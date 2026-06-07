import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminDashboardController } from './dashboard.controller';
import { AdminDashboardService } from './dashboard.service';
import { UserEntity } from '../../user/entity/user.entity';
import { InstallationEntity } from '../../installation/entity/installation.entity';
import { EnergyRequestEntity } from '../../energy-request/entity/energy-request.entity';
import { RewardTransactionEntity } from '../../reward-transaction/entity/reward-transaction.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      InstallationEntity,
      EnergyRequestEntity,
      RewardTransactionEntity,
    ]),
  ],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
  exports: [AdminDashboardService],
})
export class AdminDashboardModule {}
