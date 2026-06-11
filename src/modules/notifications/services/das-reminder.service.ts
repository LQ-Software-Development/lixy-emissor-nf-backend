import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
import { PushToken } from '../entities/push-token.entity';
import { DasReminder } from '../interfaces/notification.interface';
import { EmailService } from './email.service';
import { FCMService } from './fcm.service';

@Injectable()
export class DasReminderService {
  private readonly logger = new Logger(DasReminderService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(PushToken)
    private readonly pushTokenRepository: Repository<PushToken>,
    private readonly fcmService: FCMService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async findUpcomingDasReminders(daysBefore: number = 3): Promise<DasReminder[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBefore);
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // This would typically query a DAS/DASN table
    // For now, returning empty array as the DAS module integration would be needed
    this.logger.log(`Looking for DAS reminders due between ${targetDate.toISOString()} and ${nextDay.toISOString()}`);

    // TODO: Implement actual DAS query when DAS module is available
    // Example query:
    // return this.dasRepository.find({
    //   where: {
    //     dueDate: Between(targetDate, nextDay),
    //     status: 'pending'
    //   }
    // });

    return [];
  }

  async processReminders(): Promise<void> {
    const daysBefore = this.configService.get<number>('DAS_REMINDER_DAYS_BEFORE', 3);
    this.logger.log(`Processing DAS reminders (${daysBefore} days before due)`);

    const reminders = await this.findUpcomingDasReminders(daysBefore);

    if (reminders.length === 0) {
      this.logger.log('No DAS reminders to process');
      return;
    }

    this.logger.log(`Found ${reminders.length} DAS reminders to process`);

    for (const reminder of reminders) {
      await this.processReminder(reminder);
    }
  }

  private async processReminder(reminder: DasReminder): Promise<void> {
    const title = 'Lembrete DAS - Vencimento em 3 dias';
    const body = `Seu DAS vence em ${reminder.dueDate.toLocaleDateString('pt-BR')}. Valor: R$ ${reminder.amount.toFixed(2)}`;

    // Get active push tokens for user
    const pushTokens = await this.pushTokenRepository.find({
      where: {
        userId: reminder.userId,
        isActive: true,
      },
    });

    let pushSent = false;

    // Try to send push notification
    if (pushTokens.length > 0) {
      const tokens = pushTokens.map((pt) => pt.token);
      const result = await this.fcmService.sendBulkNotifications(tokens, title, body, {
        dasCode: reminder.dasCode,
        barcode: reminder.barcode,
        dueDate: reminder.dueDate.toISOString(),
        amount: reminder.amount.toString(),
      });

      pushSent = result.success > 0;

      // Deactivate invalid tokens
      if (result.failure > 0) {
        await this.deactivateInvalidTokens(tokens);
      }
    }

    // Fallback to email if push failed
    if (!pushSent && reminder.userEmail) {
      this.logger.log(`Push failed for user ${reminder.userId}, sending email fallback`);
      await this.emailService.sendDasReminderEmail(reminder.userEmail, reminder);
    }

    // Create notification record
    await this.notificationRepository.save(
      this.notificationRepository.create({
        userId: reminder.userId,
        title,
        body,
        type: pushSent ? NotificationType.PUSH : NotificationType.EMAIL,
        category: 'das_reminder',
        metadata: {
          dasCode: reminder.dasCode,
          barcode: reminder.barcode,
          dueDate: reminder.dueDate.toISOString(),
          amount: reminder.amount,
        },
      }),
    );
  }

  private async deactivateInvalidTokens(tokens: string[]): Promise<void> {
    // In a real implementation, you would check which tokens failed
    // and deactivate them individually
    this.logger.warn(`${tokens.length} tokens may be invalid - consider deactivating`);
  }
}
