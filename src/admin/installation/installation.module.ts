import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminInstallationController } from './installation.controller';
import { AdminInstallationService } from './installation.service';
import { InstallationEntity } from '../../installation/entity/installation.entity';
import { UserEntity } from '../../user/entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InstallationEntity, UserEntity])],
  controllers: [AdminInstallationController],
  providers: [AdminInstallationService],
  exports: [AdminInstallationService],
})
export class AdminInstallationModule {}
