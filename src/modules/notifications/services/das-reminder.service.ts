import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FiscalObligation,
  ObligationStatus,
  ObligationType,
} from '../../fiscal/entities/fiscal-obligation.entity';
import {
  NotificationCategory,
  NotificationType,
} from '../entities/notification.entity';
import { User } from '../../auth/entities/user.entity';
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
    @InjectRepository(FiscalObligation)
    private readonly obligationRepository: Repository<FiscalObligation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly fcmService: FcmService,
    private readonly emailService: EmailService,
  ) {}

  getTargetDueDate(referenceDate: Date = new Date()): string {
    const target = new Date(referenceDate);
    target.setDate(target.getDate() + this.reminderDays);
    return target.toISOString().slice(0, 10);
  }

  async processReminders(
    referenceDate: Date = new Date(),
  ): Promise<DasReminderResult> {
    const dueDate = this.getTargetDueDate(referenceDate);

    const obligations = await this.obligationRepository
      .createQueryBuilder('obligation')
      .where('obligation.type = :type', { type: ObligationType.DAS })
      .andWhere('obligation.status = :status', {
        status: ObligationStatus.PENDING,
      })
      .andWhere('DATE(obligation.dueDate) = :dueDate', { dueDate })
      .getMany();

    const result: DasReminderResult = {
      processed: obligations.length,
      notificationsCreated: 0,
      pushSent: 0,
      emailsSent: 0,
    };

    for (const obligation of obligations) {
      if (!obligation.companyId) {
        this.logger.warn(
          `Obrigação DAS ${obligation.id} sem companyId vinculado`,
        );
        continue;
      }

      const user = await this.userRepository.findOne({
        where: { id: obligation.companyId },
      });

      if (!user) {
        this.logger.warn(
          `Usuário não encontrado para obrigação DAS ${obligation.id}`,
        );
        continue;
      }

      const dueDateLabel = obligation.dueDate.toISOString().slice(0, 10);
      const barcode = obligation.barcode ?? '';
      const title = 'Lembrete de vencimento do DAS';
      const body = `Seu DAS referente a ${obligation.referencePeriod} vence em ${this.reminderDays} dias (${dueDateLabel}). Valor: R$ ${obligation.amount}.`;

      const metadata = {
        obligationId: obligation.id,
        referencePeriod: obligation.referencePeriod,
        dueDate: dueDateLabel,
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
          dueDate: dueDateLabel,
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
