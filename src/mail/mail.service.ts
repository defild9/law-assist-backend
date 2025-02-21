import * as nodemailer from 'nodemailer';
import { Injectable, Logger } from '@nestjs/common';

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

  async sendVerificationEmail(email: string, token: string) {
    try {
      const verificationUrl = `${process.env.APP_URL}/auth/verify-email?token=${token}`;

      await this.transporter.sendMail({
        from: `"Email Verification" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Email Verification',
        text: `Click the link to verify your email: ${verificationUrl}`,
        html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
      });

      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Error sending verification email to ${email}:`, error);
      throw new Error('Failed to send verification email.');
    }
  }
}
