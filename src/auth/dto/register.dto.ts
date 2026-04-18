import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';
export class RegisterDto {
  @ApiProperty({ example: 'John', type: String })
  @IsNotEmpty()
  @IsString()
  firstName: string;
  @ApiProperty({ example: 'Doe', type: String })
  @IsNotEmpty()
  @IsString()
  lastName: string;
  @ApiProperty({ example: 'test@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @ApiProperty({ example: '+92 300 1234567', type: String })
  @IsNotEmpty()
  @IsString()
  phone: string;
  @ApiProperty({ example: 'password123', type: String })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
