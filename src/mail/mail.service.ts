import * as nodemailer from 'nodemailer';
import { Injectable, Logger } from '@nestjs/common';
import { IEmailTemplate } from './templates/email-template.interface';
import { VerificationEmailTemplate } from './templates/verification-email.template';
import { ResetPasswordEmailTemplate } from './templates/reset-password-email.template';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async sendEmail(
    email: string,
    strategy: IEmailTemplate,
    actionUrl: string,
  ) {
    try {
      await this.transporter.sendMail({
        from: `"LawAssist 🚀" <${process.env.SMTP_USER}>`,
        to: email,
        subject: strategy.subject,
        text: strategy.getText(actionUrl),
        html: strategy.getHtml(actionUrl),
      });
      this.logger.log(`Email "${strategy.subject}" sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Error sending "${strategy.subject}" email to ${email}:`,
        error,
      );
      throw new Error(`Не вдалося надіслати лист: ${strategy.subject}`);
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
    const template = new VerificationEmailTemplate();
    await this.sendEmail(email, template, verificationUrl);
  }

  async sendResetPasswordEmail(email: string, token: string) {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
    const template = new ResetPasswordEmailTemplate();
    await this.sendEmail(email, template, resetUrl);
  }
}
