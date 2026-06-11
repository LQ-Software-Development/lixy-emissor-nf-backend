import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FiscalService } from './fiscal.service';

@Injectable()
export class FiscalCronService {
  private readonly logger = new Logger(FiscalCronService.name);

  constructor(private readonly fiscalService: FiscalService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyObligationStatusUpdate(): Promise<void> {
    const affected = await this.fiscalService.updateOverdueObligations();
    this.logger.log(`Updated ${affected} overdue fiscal obligation(s)`);
  }
}
