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

@Entity({ name: 'kyc' })
export class KycEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'Cnic_Front_Url', type: 'varchar', length: 255 })
  CnicFrontUrl: string;

  @Column({ name: 'Cnic_Back_Url', type: 'varchar', length: 255 })
  CnicBackUrl: string;

  @Column({ name: 'Selfie_Url', type: 'varchar', length: 255 })
  SelfieUrl: string;

  @Column({ name: 'Utility_Bill_Url', type: 'varchar', length: 255 })
  UtilityBillUrl: string;

  @Column({ name: 'city', type: 'varchar', length: 255 })
  city: string;

  @Column({ name: 'province', type: 'varchar', length: 255 })
  province: string;

  @Column({ name: 'country', type: 'varchar', length: 255 })
  country: string;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string | null;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;

  @Column({ name: 'reviewed_at', type: 'datetime', nullable: true })
  reviewedAt: Date | null;

  // Relations
  @ManyToOne(() => UserEntity, (user) => user.kycDocuments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
