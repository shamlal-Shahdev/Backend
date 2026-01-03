import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardTransactionService } from './reward-transaction.service';
import { RewardTransactionController } from './reward-transaction.controller';
import { RewardTransactionEntity } from './entity/reward-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RewardTransactionEntity])],
  controllers: [RewardTransactionController],
  providers: [RewardTransactionService],
  exports: [RewardTransactionService],
})
export class RewardTransactionModule {}
