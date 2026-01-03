import { registerAs } from '@nestjs/config';
import { EmailConfig } from './email-config.type';
import validateConfig from '../../utils/validate-config';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';

class EnvironmentVariablesValidator {
  @IsString()
  MAIL_HOST: string;

  @IsInt()
  @IsOptional()
  MAIL_PORT: number;

  @IsString()
  MAIL_USER: string;

  @IsString()
  MAIL_PASSWORD: string;

  @IsBoolean()
  @IsOptional()
  MAIL_SECURE: boolean;

  @IsBoolean()
  @IsOptional()
  MAIL_REQUIRE_TLS: boolean;

  @IsBoolean()
  @IsOptional()
  MAIL_IGNORE_TLS: boolean;

  @IsString()
  MAIL_DEFAULT_NAME: string;

  @IsEmail()
  MAIL_DEFAULT_EMAIL: string;
}

export default registerAs<EmailConfig>('mail', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    user: process.env.MAIL_USER || '',
    password: process.env.MAIL_PASSWORD || '',
    secure: process.env.MAIL_SECURE === 'true',
    requireTLS: process.env.MAIL_REQUIRE_TLS === 'true',
    ignoreTLS: process.env.MAIL_IGNORE_TLS === 'true',
    defaultName: process.env.MAIL_DEFAULT_NAME || 'WattsUp Energy',
    defaultEmail: process.env.MAIL_DEFAULT_EMAIL || 'youremail@gmail.com',
  };
});
