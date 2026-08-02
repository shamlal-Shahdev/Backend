import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { UserEntity } from '../../user/entity/user.entity';
import { MarketplaceItemEntity } from '../../marketplace-item/entity/marketplace-item.entity';
export enum RedemptionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
@Entity({ name: 'redemption' })
export class RedemptionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ name: 'user_id', type: 'int' })
  userId: number;
  @Column({ name: 'marketplace_item_id', type: 'int' })
  marketplaceItemId: number;
  @Column({ type: 'int', default: 1 })
  quantity: number;
  @Column({
    type: 'enum',
    enum: RedemptionStatus,
    default: RedemptionStatus.PENDING,
  })
  status: RedemptionStatus;

  @Column({ name: 'tx_hash', type: 'varchar', length: 128, nullable: true })
  txHash: string | null;

  @Column({ name: 'block_number', type: 'int', nullable: true })
  blockNumber: number | null;

  @Column({ name: 'tokens_used', type: 'decimal', precision: 18, scale: 8, nullable: true })
  tokensUsed: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  @ManyToOne(() => UserEntity, (user) => user.redemptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
  @ManyToOne(
    () => MarketplaceItemEntity,
    (marketplaceItem) => marketplaceItem.redemptions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'marketplace_item_id' })
  marketplaceItem: MarketplaceItemEntity;
}
