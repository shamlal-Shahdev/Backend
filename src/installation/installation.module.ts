import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstallationService } from './installation.service';
import { InstallationController } from './installation.controller';
import { InstallationEntity } from './entity/installation.entity';
import { UserEntity } from '../user/entity/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([InstallationEntity, UserEntity])],
  controllers: [InstallationController],
  providers: [InstallationService],
  exports: [InstallationService],
})
export class InstallationModule {}
