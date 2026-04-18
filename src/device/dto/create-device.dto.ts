import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { DeviceType, DeviceStatus } from '../entity/device.entity';
export class CreateDeviceDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  installationId: number;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  deviceUuid: string;
  @ApiProperty({ enum: DeviceType, example: DeviceType.SMART_METER })
  @IsEnum(DeviceType)
  deviceType: DeviceType;
  @ApiProperty({
    enum: DeviceStatus,
    default: DeviceStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;
}
