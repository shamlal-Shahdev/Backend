import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class VendorRegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'vendor@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({
    example: '+923001234567',
    description:
      'Pakistan mobile: +92 followed by 10 digits, or 10-digit local number only',
  })
  @IsString()
  @Matches(/^(\+92\d{10}|\d{10})$/, {
    message:
      'Phone must be 10 digits (local) or +92 followed by exactly 10 digits',
  })
  phone: string;
}
