import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: Number(this.configService.get<string>('MAIL_PORT')) || 587,
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  private compileTemplate(
    templateName: string,
    context: Record<string, any>,
  ): string {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'mail',
      'templates',
      `${templateName}.hbs`,
    );

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(templateSource);

    return compiledTemplate(context);
  }

  async sendMail(params: {
    to: string;
    subject: string;
    templateName: string;
    context: Record<string, any>;
  }) {
    const { to, subject, templateName, context } = params;

    try {
      const html = this.compileTemplate(templateName, context);

      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error('Mail sending error:', error);
      throw new InternalServerErrorException('Unable to send email');
    }
  }

  async sendVerificationEmail(to: string, payload: {
    name: string;
    code: string;
  }) {
    return this.sendMail({
      to,
      subject: 'Verify your email',
      templateName: 'verify-email',
      context: payload,
    });
  }

  async sendResetPasswordEmail(to: string, payload: {
    name: string;
    code: string;
  }) {
    return this.sendMail({
      to,
      subject: 'Reset your password',
      templateName: 'reset-password',
      context: payload,
    });
  }

  async sendVendorApprovedEmail(
  to: string,
  payload: {
    name: string;
    subject: string;
  },
) {
  return this.sendMail({
    to,
    subject: `${payload.subject} approved`,
    templateName: 'vendor-approved',
    context: payload,
  });
}

  async sendVendorRejectedEmail(
    to: string,
    payload: {
      name: string;
      subject: string;
      reason: string;
    },
  ) {
    return this.sendMail({
      to,
      subject: `${payload.subject} rejected`,
      templateName: 'vendor-rejected',
      context: payload,
    });
  }
}