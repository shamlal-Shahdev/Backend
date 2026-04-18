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
import { InstallationEntity } from '../../installation/entity/installation.entity';
@Entity({ name: 'certificate' })
export class CertificateEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ name: 'user_id', type: 'int' })
  userId: number;
  @Column({ name: 'installation_id', type: 'int' })
  installationId: number;
  @Column({ type: 'int' })
  month: number;
  @Column({ type: 'int' })
  year: number;
  @Column({ name: 'total_kwh', type: 'decimal', precision: 15, scale: 4 })
  totalKwh: number;
  @Column({
    name: 'total_co2_offset',
    type: 'decimal',
    precision: 15,
    scale: 4,
  })
  totalCo2Offset: number;
  @Column({ name: 'file_path', type: 'varchar', length: 500 })
  filePath: string;
  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;
  @ManyToOne(() => UserEntity, (user) => user.certificates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
  @ManyToOne(
    () => InstallationEntity,
    (installation) => installation.certificates,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'installation_id' })
  installation: InstallationEntity;
}
