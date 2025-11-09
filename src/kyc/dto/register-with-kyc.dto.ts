import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsDateString,
  IsEnum,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';
import { Gender } from '../infrastructure/persistence/relational/entities/kyc.entity';

export class RegisterWithKycDto {
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

  @ApiProperty({ example: 'SecurePass@123', type: String })
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  password: string;

  @ApiProperty({ example: '+92 300 1234567', type: String })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Karachi', type: String })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'Sindh', type: String })
  @IsNotEmpty()
  @IsString()
  province: string;

  @ApiProperty({ example: 'Pakistan', type: String })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({ example: 'male', enum: Gender })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '1990-01-01', type: String })
  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: '42101-1234567-1', type: String })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{5}-\d{7}-\d{1}$/, { message: 'Invalid CNIC format. Use: 42101-1234567-1' })
  cnicNumber: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  cnicFront: Express.Multer.File;

  @ApiProperty({ type: 'string', format: 'binary' })
  cnicBack: Express.Multer.File;

  @ApiProperty({ type: 'string', format: 'binary' })
  selfie: Express.Multer.File;
}

