import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstallationService } from './installation.service';
import { InstallationController } from './installation.controller';
import { InstallationEntity } from './entity/installation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InstallationEntity])],
  controllers: [InstallationController],
  providers: [InstallationService],
  exports: [InstallationService],
})
export class InstallationModule {}
