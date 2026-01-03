import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+923001234567',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(20)
  phone?: string;
}
