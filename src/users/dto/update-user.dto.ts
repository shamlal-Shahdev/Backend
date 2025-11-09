import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', type: String, required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '+92 300 1234567', type: String, required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'residential', type: String, required: false })
  @IsOptional()
  @IsString()
  installationType?: string;
}
