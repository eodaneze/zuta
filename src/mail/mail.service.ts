import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import axios from 'axios';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  private renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ) {
    const templatesDir = path.resolve(process.cwd(), 'src/mail/templates');
    const filePath = path.join(templatesDir, `${templateName}.hbs`);
    const source = fs.readFileSync(filePath, 'utf8');
    const template = handlebars.compile(source);

    return template(context);
  }

  private async sendViaBrevo(
    toEmail: string,
    subject: string,
    htmlContent: string,
  ) {
    const apiKey = this.configService.get<string>('BROVO_API_KEY');
    const senderEmail = this.configService.get<string>('MAILER_SENDER');

    const ip = await axios.get('https://api.ipify.org?format=json');
    console.log('CURRENT IP:', ip.data);

    if (!apiKey) {
      throw new InternalServerErrorException(
        'Brevo API key is not configured',
      );
    }

    if (!senderEmail) {
      throw new InternalServerErrorException(
        'Sender email is not configured',
      );
    }

    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: {
            email: senderEmail,
            name: 'ZutaOnline',
          },
          to: [{ email: toEmail }],
          subject,
          htmlContent,
        },
        {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      console.error(
        'Brevo sending error:',
        error?.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        error?.response?.data?.message || 'Failed to send email',
      );
    }
  }

  async sendVerificationEmail(email: string, name: string, code: string) {
    const html = this.renderTemplate('verify-email', {
      name,
      code,
    });

    await this.sendViaBrevo(email, 'Verify your email', html);
  }

  async sendResetPasswordEmail(email: string, name: string, code: string) {
    const html = this.renderTemplate('reset-password', {
      name,
      code,
    });

    await this.sendViaBrevo(email, 'Reset your password', html);
  }

  async sendVendorApprovedEmail(email: string, name: string) {
    const html = this.renderTemplate('vendor-approved', {
      name,
    });

    await this.sendViaBrevo(email, 'Store profile approved', html);
  }

  async sendVendorRejectedEmail(
    email: string,
    name: string,
    reason: string,
  ) {
    const html = this.renderTemplate('vendor-rejected', {
      name,
      reason,
    });

    await this.sendViaBrevo(email, 'Store profile rejected', html);
  }

  async sendProductApprovedEmail(
    email: string,
    name: string,
    productName: string,
  ) {
    const html = this.renderTemplate('product-approved', {
      name,
      productName,
    });

    await this.sendViaBrevo(email, 'Product approved', html);
  }

  async sendProductRejectedEmail(
    email: string,
    name: string,
    productName: string,
    reason: string,
  ) {
    const html = this.renderTemplate('product-rejected', {
      name,
      productName,
      reason,
    });

    await this.sendViaBrevo(email, 'Product rejected', html);
  }
}