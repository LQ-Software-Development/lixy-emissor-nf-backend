import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DasReminderService } from '../services/das-reminder.service';

@Injectable()
export class DasReminderJob {
  private readonly logger = new Logger(DasReminderJob.name);

  constructor(private readonly dasReminderService: DasReminderService) {}

  @Cron('0 8 * * *', {
    name: 'das-reminder',
    timeZone: 'America/Sao_Paulo',
  })
  async handleCron(): Promise<void> {
    await this.execute();
  }

  async execute(): Promise<void> {
    this.logger.log('Iniciando job de lembrete DAS');
    const result = await this.dasReminderService.processReminders();
    this.logger.log(
      `Job DAS concluído: ${result.notificationsCreated} notificações criadas`,
    );
  }
}
