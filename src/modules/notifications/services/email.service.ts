import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;

    if (!this.resend) {
      this.logger.warn(
        'RESEND_API_KEY not configured; email delivery disabled',
      );
    }
  }

  isConfigured(): boolean {
    return this.resend !== null;
  }

  async send(payload: EmailPayload): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn('Resend not configured; skipping email delivery');
      return false;
    }

    const from = this.configService.get<string>('RESEND_FROM');

    if (!from) {
      this.logger.warn('RESEND_FROM not configured; skipping email delivery');
      return false;
    }

    const { error } = await this.resend.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text ?? payload.html.replace(/<[^>]+>/g, ''),
    });

    if (error) {
      this.logger.error(`Resend delivery failed: ${error.message}`);
      return false;
    }

    return true;
  }
}
