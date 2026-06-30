import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { UserEntity } from '../../user/entity/user.entity';
import { CouponPurchaseEntity } from './coupon-purchase.entity';

export enum CouponStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

export enum CouponValueType {
  AMOUNT = 'amount',
  PERCENTAGE = 'percentage',
}

@Entity({ name: 'coupon' })
export class CouponEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'vendor_id', type: 'int' })
  vendorId: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'coupon_value', type: 'decimal', precision: 18, scale: 2 })
  couponValue: number;

  @Column({
    name: 'value_type',
    type: 'enum',
    enum: CouponValueType,
    default: CouponValueType.AMOUNT,
  })
  valueType: CouponValueType;

  @Column({ name: 'token_cost', type: 'decimal', precision: 18, scale: 8 })
  tokenCost: number;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ name: 'expiry_date', type: 'date' })
  expiryDate: Date;

  @Column({ name: 'terms_and_conditions', type: 'text' })
  termsAndConditions: string;

  @Column({ name: 'redemption_code', type: 'varchar', length: 64, default: '' })
  redemptionCode: string;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({
    type: 'enum',
    enum: CouponStatus,
    default: CouponStatus.ACTIVE,
  })
  status: CouponStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: UserEntity;

  @OneToMany(() => CouponPurchaseEntity, (purchase) => purchase.coupon)
  purchases: CouponPurchaseEntity[];
}
