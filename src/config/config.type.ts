import { AppConfig } from './app-config.type';
import { AuthConfig } from '../auth/config/auth-config.type';
import { DatabaseConfig } from '../database/config/database-config.type';
import { FileConfig } from '../files/config/file-config.type';
import { EmailConfig } from '../email/config/email-config.type';

export type AllConfigType = {
  app: AppConfig;
  auth: AuthConfig;
  mail: EmailConfig;
  database: DatabaseConfig;
  file: FileConfig;
};
