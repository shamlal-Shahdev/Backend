import { Injectable } from '@nestjs/common';
import fs from 'node:fs/promises';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { AllConfigType } from '../config/config.type';


@Injectable()
export class MailerService {
private readonly transporter: nodemailer.Transporter;


constructor(private readonly configService: ConfigService<AllConfigType>) {
const host = this.configService.getOrThrow('mail.host', { infer: true });
const port = this.configService.getOrThrow('mail.port', { infer: true });
const user = this.configService.getOrThrow('mail.user', { infer: true });
const pass = this.configService.getOrThrow('mail.password', { infer: true });


this.transporter = nodemailer.createTransport({
host,
port,
secure: this.configService.get<boolean>('mail.secure', { infer: true }) ?? false,
requireTLS: this.configService.get<boolean>('mail.requireTLS', { infer: true }) ?? true,
ignoreTLS: this.configService.get<boolean>('mail.ignoreTLS', { infer: true }) ?? false,
auth: { user, pass },
});
}


async sendMail({
templatePath,
context,
...mailOptions
}: nodemailer.SendMailOptions & {
templatePath?: string;
context?: Record<string, unknown>;
}): Promise<void> {
let html: string | undefined = undefined;


if (templatePath) {
const template = await fs.readFile(templatePath, 'utf-8');
const compiled = Handlebars.compile(template, { strict: true });
html = compiled(context ?? {});
}


const from = mailOptions.from
? (mailOptions.from as string)
: `"${this.configService.get('mail.defaultName', { infer: true })}" Szabist <shamlalshahdev475@gmail.com>`;


try {
const info = await this.transporter.sendMail({
...mailOptions,
from,
html: mailOptions.html ? (mailOptions.html as string) : html,
text: mailOptions.text ? (mailOptions.text as string) : (html ? html.replace(/<[^>]*>/g, '') : undefined),
});


console.log('Email sent:', info.messageId);
} catch (error) {
console.error('Error sending email:', error);
throw error;
}
}
}