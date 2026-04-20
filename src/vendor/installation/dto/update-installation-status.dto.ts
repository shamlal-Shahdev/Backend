import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
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

  @ApiPropertyOptional({
    description:
      'Utility meter ID (required when status is completed). Must be unique per vendor.',
  })
  @ValidateIf((o) => o.status === InstallationStatus.COMPLETED)
  @IsString()
  @IsNotEmpty({ message: 'meterId is required when marking installation as completed' })
  meterId?: string;
}
