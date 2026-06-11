import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { PushToken } from './entities/push-token.entity';
import { DasReminderJob } from './jobs/das-reminder.job';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { DasReminderService } from './services/das-reminder.service';
import { EmailService } from './services/email.service';
import { FCMService } from './services/fcm.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, PushToken]),
    ScheduleModule.forRoot(),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    FCMService,
    EmailService,
    DasReminderService,
    DasReminderJob,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
