import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { RedemptionEntity } from '../../redemption/entity/redemption.entity';

export enum ItemType {
  VOUCHER = 'voucher',
  DIGITAL = 'digital',
  PHYSICAL = 'physical',
}

@Entity({ name: 'marketplace_item' })
export class MarketplaceItemEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'price_tokens', type: 'decimal', precision: 18, scale: 8 })
  priceTokens: number;

  @Column({
    name: 'item_type',
    type: 'enum',
    enum: ItemType,
  })
  itemType: ItemType;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => RedemptionEntity, (redemption) => redemption.marketplaceItem)
  redemptions: RedemptionEntity[];
}
