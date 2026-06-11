import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FiscalObligationRef,
  FiscalObligationStatus,
  FiscalObligationType,
} from '../entities/fiscal-obligation-ref.entity';
import {
  NotificationCategory,
  NotificationType,
} from '../entities/notification.entity';
import { UserRef } from '../entities/user-ref.entity';
import { NotificationsService } from '../notifications.service';
import { EmailService } from './email.service';
import { FcmService } from './fcm.service';

export type DasReminderResult = {
  processed: number;
  notificationsCreated: number;
  pushSent: number;
  emailsSent: number;
};

@Injectable()
export class DasReminderService {
  private readonly logger = new Logger(DasReminderService.name);
  private readonly reminderDays = 3;

  constructor(
    @InjectRepository(FiscalObligationRef)
    private readonly obligationRepository: Repository<FiscalObligationRef>,
    @InjectRepository(UserRef)
    private readonly userRepository: Repository<UserRef>,
    private readonly notificationsService: NotificationsService,
    private readonly fcmService: FcmService,
    private readonly emailService: EmailService,
  ) {}

  getTargetDueDate(referenceDate: Date = new Date()): string {
    const target = new Date(referenceDate);
    target.setDate(target.getDate() + this.reminderDays);
    return target.toISOString().slice(0, 10);
  }

  async processReminders(referenceDate: Date = new Date()): Promise<DasReminderResult> {
    const dueDate = this.getTargetDueDate(referenceDate);

    const obligations = await this.obligationRepository.find({
      where: {
        type: FiscalObligationType.DAS,
        status: FiscalObligationStatus.PENDING,
        dueDate,
      },
    });

    const result: DasReminderResult = {
      processed: obligations.length,
      notificationsCreated: 0,
      pushSent: 0,
      emailsSent: 0,
    };

    for (const obligation of obligations) {
      const user = await this.userRepository.findOne({
        where: { id: obligation.companyId },
      });

      if (!user) {
        this.logger.warn(
          `Usuário não encontrado para obrigação DAS ${obligation.id}`,
        );
        continue;
      }

      const barcode = obligation.barcode ?? '';
      const title = 'Lembrete de vencimento do DAS';
      const body = `Seu DAS referente a ${obligation.referencePeriod} vence em ${this.reminderDays} dias (${dueDate}). Valor: R$ ${obligation.amount}.`;

      const metadata = {
        obligationId: obligation.id,
        referencePeriod: obligation.referencePeriod,
        dueDate: obligation.dueDate,
        amount: obligation.amount,
        barcode,
      };

      const notification = await this.notificationsService.create({
        userId: user.id,
        title,
        body,
        type: NotificationType.DAS_REMINDER,
        category: NotificationCategory.DAS,
        metadata,
      });

      result.notificationsCreated += 1;

      const pushTokens = await this.notificationsService.getActivePushTokens(
        user.id,
      );

      const pushResult = await this.fcmService.sendToTokens(pushTokens, {
        title,
        body,
        data: {
          notificationId: notification.id,
          type: NotificationType.DAS_REMINDER,
          barcode,
          dueDate: obligation.dueDate,
          amount: obligation.amount,
        },
      });

      result.pushSent += pushResult.successCount;

      if (pushResult.successCount === 0) {
        const emailSent = await this.emailService.send({
          to: user.email,
          subject: title,
          html: `<p>${body}</p><p><strong>Código de barras:</strong> ${barcode || 'N/A'}</p>`,
        });

        if (emailSent) {
          result.emailsSent += 1;
        }
      }
    }

    this.logger.log(
      `Lembretes DAS processados: ${result.processed}, notificações: ${result.notificationsCreated}`,
    );

    return result;
  }
}
