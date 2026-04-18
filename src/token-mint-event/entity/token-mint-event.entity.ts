import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { RewardTransactionEntity } from '../../reward-transaction/entity/reward-transaction.entity';
@Entity({ name: 'token_mint_event' })
export class TokenMintEventEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;
  rewardTransactionId: number;
  @Column({ name: 'tx_hash', type: 'varchar', length: 255 })
  txHash: string;
  @Column({ type: 'decimal', precision: 18, scale: 8 })
  amount: number;
  @CreateDateColumn({ name: 'minted_at' })
  mintedAt: Date;
  @OneToOne(
    () => RewardTransactionEntity,
    (rewardTransaction) => rewardTransaction.tokenMintEvent,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'reward_transaction_id', referencedColumnName: 'id' })
  rewardTransaction: RewardTransactionEntity;
}
