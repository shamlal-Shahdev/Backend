import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { UserRole } from '../entity/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ example: 'hashed_password_string' })
  @IsString()
  passwordHash: string;

  @ApiProperty({ enum: UserRole, default: UserRole.USER, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  verificationToken?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  resetToken?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  password?: string;
}
