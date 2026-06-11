import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/entities/user.entity';
import { FiscalModule } from '../fiscal/fiscal.module';
import { DasReminderJob } from './jobs/das-reminder.job';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { PushToken } from './entities/push-token.entity';
import { DasReminderService } from './services/das-reminder.service';
import { EmailService } from './services/email.service';

@Module({
  imports: [
    FiscalModule,
    AuthModule,
    TypeOrmModule.forFeature([Notification, PushToken, User]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmailService,
    DasReminderService,
    DasReminderJob,
  ],
  exports: [NotificationsService, DasReminderService],
})
export class NotificationsModule {}
