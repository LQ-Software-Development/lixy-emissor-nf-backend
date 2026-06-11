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
  private client: Resend | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initialize();
  }

  private initialize(): void {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY not configured; email delivery disabled',
      );
      return;
    }

    this.client = new Resend(apiKey);
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async send(payload: EmailPayload): Promise<boolean> {
    if (!this.client) {
      this.logger.warn('Resend not configured; skipping email delivery');
      return false;
    }

    const from =
      this.configService.get<string>('RESEND_FROM') ?? 'onboarding@resend.dev';

    const { error } = await this.client.emails.send({
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
