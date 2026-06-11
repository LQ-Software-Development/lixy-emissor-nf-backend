import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DasReminderJob } from './jobs/das-reminder.job';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FiscalObligationRef } from './entities/fiscal-obligation-ref.entity';
import { Notification } from './entities/notification.entity';
import { PushToken } from './entities/push-token.entity';
import { UserRef } from './entities/user-ref.entity';
import { DasReminderService } from './services/das-reminder.service';
import { EmailService } from './services/email.service';
import { FcmService } from './services/fcm.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      PushToken,
      FiscalObligationRef,
      UserRef,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    FcmService,
    EmailService,
    DasReminderService,
    DasReminderJob,
  ],
  exports: [NotificationsService, DasReminderService],
})
export class NotificationsModule {}
