import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { InstallationStatus } from '../../../installation/entity/installation.entity';
export class UpdateInstallationStatusDto {
  @ApiProperty({
    enum: InstallationStatus,
    example: InstallationStatus.IN_PROGRESS,
    description: 'New installation status',
  })
  @IsEnum(InstallationStatus)
  @IsNotEmpty()
  status: InstallationStatus;
}
