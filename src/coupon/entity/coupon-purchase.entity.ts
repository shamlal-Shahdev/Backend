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
import { CouponEntity } from './coupon.entity';

export enum CouponPurchaseStatus {
  ACTIVE = 'active',
  USED = 'used',
  EXPIRED = 'expired',
}

@Entity({ name: 'coupon_purchase' })
export class CouponPurchaseEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'coupon_id', type: 'int' })
  couponId: number;

  @Column({ name: 'vendor_id', type: 'int' })
  vendorId: number;

  @Column({ name: 'coupon_code', type: 'varchar', length: 32, unique: true })
  couponCode: string;

  @Column({ name: 'tokens_used', type: 'decimal', precision: 18, scale: 8 })
  tokensUsed: number;

  @Column({ name: 'tx_hash', type: 'varchar', length: 255, nullable: true })
  txHash: string | null;

  @Column({ name: 'block_number', type: 'int', nullable: true })
  blockNumber: number | null;

  @Column({
    type: 'enum',
    enum: CouponPurchaseStatus,
    default: CouponPurchaseStatus.ACTIVE,
  })
  status: CouponPurchaseStatus;

  @CreateDateColumn({ name: 'purchase_date' })
  purchaseDate: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => CouponEntity, (coupon) => coupon.purchases, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'coupon_id' })
  coupon: CouponEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: UserEntity;
}
