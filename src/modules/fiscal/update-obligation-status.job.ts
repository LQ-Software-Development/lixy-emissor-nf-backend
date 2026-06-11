import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FiscalObligation,
  FiscalObligationStatus,
} from './entities/fiscal-obligation.entity';

@Injectable()
export class UpdateObligationStatusJob {
  private readonly logger = new Logger(UpdateObligationStatusJob.name);

  constructor(
    @InjectRepository(FiscalObligation)
    private readonly obligationRepository: Repository<FiscalObligation>,
  ) {}

  @Cron('0 6 * * *', {
    name: 'update-fiscal-obligation-status',
    timeZone: 'America/Sao_Paulo',
  })
  async handleCron(): Promise<void> {
    await this.execute();
  }

  async execute(): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);

    const result = await this.obligationRepository
      .createQueryBuilder()
      .update(FiscalObligation)
      .set({ status: FiscalObligationStatus.OVERDUE })
      .where('status = :status', { status: FiscalObligationStatus.PENDING })
      .andWhere('dueDate < :today', { today })
      .execute();

    const affected = result.affected ?? 0;
    this.logger.log(`Obrigações atualizadas para overdue: ${affected}`);
    return affected;
  }
}
