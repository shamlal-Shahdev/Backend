import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', type: String, required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'residential', type: String, required: false })
  @IsOptional()
  @IsString()
  installationType?: string;
}
