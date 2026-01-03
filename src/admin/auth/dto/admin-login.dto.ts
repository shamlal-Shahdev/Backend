import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '../../../utils/transformers/lower-case.transformer';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', type: String })
  @IsNotEmpty()
  password: string;
}
