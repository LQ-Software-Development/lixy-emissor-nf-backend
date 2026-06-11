import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DasReminderService } from '../services/das-reminder.service';

@Injectable()
export class DasReminderJob {
  private readonly logger = new Logger(DasReminderJob.name);

  constructor(private readonly dasReminderService: DasReminderService) {}

  @Cron('0 8 * * *', {
    timeZone: 'America/Sao_Paulo',
    name: 'das-reminder',
  })
  async handleDasReminderCron() {
    this.logger.log('Starting DAS reminder cron job');

    try {
      await this.dasReminderService.processReminders();
      this.logger.log('DAS reminder cron job completed successfully');
    } catch (error) {
      this.logger.error('DAS reminder cron job failed', error);
    }
  }
}
