import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { UserEntity } from '../../user/entity/user.entity';

@Entity({ name: 'user_wallet' })
export class UserWalletEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int', unique: true })
  userId: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  address: string;

  @Column({
    name: 'encrypted_private_key',
    type: 'text',
    nullable: true,
    select: false,
  })
  encryptedPrivateKey: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => UserEntity, (user) => user.userWallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
