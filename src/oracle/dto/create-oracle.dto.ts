import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { OracleStatus } from '../entity/oracle.entity';
export class CreateOracleDto {
  @ApiProperty({ example: 'Oracle Alpha' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;
  @ApiProperty({
    enum: OracleStatus,
    default: OracleStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(OracleStatus)
  status?: OracleStatus;
}
