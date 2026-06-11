import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { DasReminder } from '../interfaces/notification.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !port || !user || !pass) {
      this.logger.warn('SMTP configuration incomplete - email disabled');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    this.logger.log('Email transporter initialized');
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not configured - skipping email');
      return false;
    }

    try {
      const from = this.configService.get<string>('SMTP_FROM', 'LQ Emissor NF <noreply@lqserver.cc>');

      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent to: ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      return false;
    }
  }

  async sendDasReminderEmail(to: string, dasInfo: DasReminder): Promise<boolean> {
    const subject = `Lembrete DAS - Vencimento em 3 dias`;
    const html = this.buildDasReminderHtml(dasInfo);

    return this.sendEmail(to, subject, html);
  }

  private buildDasReminderHtml(dasInfo: DasReminder): string {
    const formattedDate = dasInfo.dueDate.toLocaleDateString('pt-BR');
    const formattedAmount = dasInfo.amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .highlight { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .barcode { font-family: monospace; font-size: 12px; word-break: break-all; background-color: #e5e7eb; padding: 10px; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .button { display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Lembrete DAS</h1>
          </div>
          <div class="content">
            <p>Olá!</p>
            <p>Seu DAS vence em <strong>3 dias</strong>. Confira os detalhes:</p>

            <div class="highlight">
              <p><strong>Código:</strong> ${dasInfo.dasCode}</p>
              <p><strong>Vencimento:</strong> ${formattedDate}</p>
              <p><strong>Valor:</strong> ${formattedAmount}</p>
            </div>

            <p><strong>Código de barras para pagamento:</strong></p>
            <div class="barcode">${dasInfo.barcode}</div>

            <p style="margin-top: 20px;">Não esqueça de pagar antes do vencimento para evitar juros e multas.</p>
          </div>
          <div class="footer">
            <p>Este é um lembrete automático do LQ Emissor NF</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
