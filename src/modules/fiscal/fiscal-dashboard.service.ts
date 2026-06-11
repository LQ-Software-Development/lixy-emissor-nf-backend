import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_DAS_AMOUNT, MEI_ANNUAL_LIMIT } from './fiscal.constants';
import { FiscalDashboardDto, NextDasDto } from './dto/fiscal-dashboard.dto';
import { NotaFiscal } from './entities/nota-fiscal.entity';
import {
  FiscalObligation,
  FiscalObligationStatus,
  FiscalObligationType,
} from './entities/fiscal-obligation.entity';

@Injectable()
export class FiscalDashboardService {
  constructor(
    @InjectRepository(NotaFiscal)
    private readonly notaFiscalRepository: Repository<NotaFiscal>,
    @InjectRepository(FiscalObligation)
    private readonly obligationRepository: Repository<FiscalObligation>,
  ) {}

  async execute(companyId: string): Promise<FiscalDashboardDto> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [monthlyRevenueRaw, annualRevenueRaw, totalNfsEmitted, nextDas] =
      await Promise.all([
        this.sumRevenue(companyId, monthStart, nextMonthStart),
        this.sumRevenue(companyId, yearStart, nextMonthStart),
        this.notaFiscalRepository.count({ where: { companyId } }),
        this.findNextDas(companyId, now),
      ]);

    return {
      monthlyRevenue: monthlyRevenueRaw,
      meiAnnualLimit: MEI_ANNUAL_LIMIT,
      annualRevenue: annualRevenueRaw,
      nextDas,
      totalNfsEmitted,
    };
  }

  private async sumRevenue(
    companyId: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    const result = await this.notaFiscalRepository
      .createQueryBuilder('nf')
      .select('COALESCE(SUM(nf.amount), 0)', 'total')
      .where('nf.companyId = :companyId', { companyId })
      .andWhere('nf.issuedAt >= :from', { from })
      .andWhere('nf.issuedAt < :to', { to })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  private async findNextDas(
    companyId: string,
    now: Date,
  ): Promise<NextDasDto | null> {
    const today = this.toDateString(now);

    const obligation = await this.obligationRepository
      .createQueryBuilder('obligation')
      .where('obligation.companyId = :companyId', { companyId })
      .andWhere('obligation.type = :type', { type: FiscalObligationType.DAS })
      .andWhere('obligation.status IN (:...statuses)', {
        statuses: [
          FiscalObligationStatus.PENDING,
          FiscalObligationStatus.OVERDUE,
        ],
      })
      .orderBy('obligation.dueDate', 'ASC')
      .getOne();

    if (!obligation) {
      return this.buildSyntheticNextDas(now, today);
    }

    return {
      dueDate: obligation.dueDate,
      amount: Number(obligation.amount),
      daysRemaining: this.daysBetween(today, obligation.dueDate),
    };
  }

  private buildSyntheticNextDas(now: Date, today: string): NextDasDto {
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 20);
    if (dueDate < now) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    const dueDateString = this.toDateString(dueDate);

    return {
      dueDate: dueDateString,
      amount: DEFAULT_DAS_AMOUNT,
      daysRemaining: this.daysBetween(today, dueDateString),
    };
  }

  private toDateString(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private daysBetween(from: string, to: string): number {
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T00:00:00.000Z`);
    const diffMs = end.getTime() - start.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }
}
