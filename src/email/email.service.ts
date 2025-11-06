import { Injectable } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';


@Injectable()
export class EmailService {
constructor(
private readonly mailer: MailerService,
private readonly configService: ConfigService,
) {}


async sendVerificationEmail(to: string, token: string) {
const frontendUrl = this.configService.getOrThrow('app.frontendUrl', { infer: true });
const verificationLink = `http://localhost:3000/api/auth/verify?token=${token}`;


await this.mailer.sendMail({
to,
subject: 'Verify Your Email - WattsUp Energy',
templatePath: join(__dirname, 'templates', 'verify.hbs'),
context: { verificationLink },
});
}


async sendResetPasswordEmail(to: string, token: string) {
const frontendUrl = this.configService.getOrThrow('app.frontendUrl', { infer: true });
const resetLink = `${frontendUrl}/reset-password?token=${token}`;


await this.mailer.sendMail({
to,
subject: 'Reset Your Password - WattsUp Energy',
templatePath: join(__dirname, 'templates', 'reset-password.hbs'),
context: { resetLink },
});
}
}