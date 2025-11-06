import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ConfigModule } from '@nestjs/config';
import { MailerService } from './mailer.service';
import emailConfig from './config/email.config';

@Module({
  imports: [ConfigModule.forFeature(emailConfig)],
  providers: [EmailService, MailerService],
  exports: [EmailService],
})
export class EmailModule {}

