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
    const frontendUrl = this.configService.getOrThrow('app.frontendUrl', {
      infer: true,
    });
    // Send frontend URL - frontend will handle API call to backend
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    await this.mailer.sendMail({
      to,
      subject: 'Verify Your Email - WattsUp Energy',
      templatePath: join(__dirname, 'templates', 'verify.hbs'),
      context: { verificationLink },
    });
  }

  async sendResetPasswordEmail(to: string, token: string, routePath: string = '/reset-password') {
    const frontendUrl = this.configService.getOrThrow('app.frontendUrl', {
      infer: true,
    });
    const resetLink = `${frontendUrl}${routePath}?token=${token}`;

    await this.mailer.sendMail({
      to,
      subject: 'Reset Your Password - WattsUp Energy',
      templatePath: join(__dirname, 'templates', 'reset-password.hbs'),
      context: { resetLink },
    });
  }

  async sendKycApprovalEmail(to: string, name: string, note?: string) {
    await this.mailer.sendMail({
      to,
      subject: 'KYC Approved - WattsUp Energy',
      templatePath: join(__dirname, 'templates', 'kyc-approval.hbs'),
      context: { name, note },
    });
  }

  async sendKycRejectionEmail(to: string, name: string, reason: string) {
    await this.mailer.sendMail({
      to,
      subject: 'KYC Rejected - WattsUp Energy',
      templatePath: join(__dirname, 'templates', 'kyc-rejection.hbs'),
      context: { name, reason },
    });
  }

  async sendEnergyRequestSubmittedEmail(
    to: string,
    name: string,
    month: number,
    year: number,
  ) {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    await this.mailer.sendMail({
      to,
      subject: 'Energy Request Submitted - WattsUp Energy',
      templatePath: join(__dirname, 'templates', 'energy-request-submitted.hbs'),
      context: { name, month: monthNames[month - 1], year },
    });
  }

  async sendEnergyRequestApprovedEmail(
    to: string,
    name: string,
    month: number,
    year: number,
    note?: string,
  ) {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    await this.mailer.sendMail({
      to,
      subject: 'Energy Request Approved - WattsUp Energy',
      templatePath: join(__dirname, 'templates', 'energy-request-approved.hbs'),
      context: { name, month: monthNames[month - 1], year, note },
    });
  }

  async sendEnergyRequestRejectedEmail(
    to: string,
    name: string,
    month: number,
    year: number,
    reason: string,
  ) {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    await this.mailer.sendMail({
      to,
      subject: 'Energy Request Rejected - WattsUp Energy',
      templatePath: join(__dirname, 'templates', 'energy-request-rejected.hbs'),
      context: { name, month: monthNames[month - 1], year, reason },
    });
  }

  async sendEnergyRewardGeneratedEmail(
    to: string,
    name: string,
    month: number,
    year: number,
    rewardAmount?: number,
    transactionHash?: string,
  ) {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    await this.mailer.sendMail({
      to,
      subject: 'Reward Generated Successfully - WattsUp Energy',
      templatePath: join(__dirname, 'templates', 'energy-reward-generated.hbs'),
      context: {
        name,
        month: monthNames[month - 1],
        year,
        rewardAmount,
        transactionHash,
      },
    });
  }
}
