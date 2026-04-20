import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../utils/relational-entity-helper';
import { UserEntity } from '../../../user/entity/user.entity';

@Entity({ name: 'vendor_company_profile' })
export class VendorCompanyProfileEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int', unique: true })
  userId: number;

  @Column({ name: 'company_name', type: 'varchar', length: 255 })
  companyName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  province: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  country: string | null;

  @Column({ name: 'address_line', type: 'varchar', length: 500, nullable: true })
  addressLine: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => UserEntity, (user) => user.vendorCompanyProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
