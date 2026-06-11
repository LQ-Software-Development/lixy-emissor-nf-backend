import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MEI_ANNUAL_LIMIT } from './constants/fiscal.constants';
import { FiscalDashboardDto } from './dto/fiscal-dashboard.dto';
import { FiscalObligationDto } from './dto/fiscal-obligation.dto';
import {
  FiscalObligation,
  ObligationStatus,
  ObligationType,
} from './entities/fiscal-obligation.entity';
import { Invoice } from './entities/invoice.entity';

@Injectable()
export class FiscalService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(FiscalObligation)
    private readonly obligationsRepository: Repository<FiscalObligation>,
  ) {}

  async getDashboard(): Promise<FiscalDashboardDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const [monthlyRevenue, annualRevenue, totalInvoices, nextDas] =
      await Promise.all([
        this.sumInvoiceAmount(startOfMonth, endOfMonth),
        this.sumInvoiceAmount(startOfYear, now),
        this.invoicesRepository.count(),
        this.findNextDas(),
      ]);

    return {
      monthlyRevenue,
      meiAnnualLimit: MEI_ANNUAL_LIMIT,
      annualRevenue,
      nextDas,
      totalInvoices,
    };
  }

  async getObligations(): Promise<FiscalObligationDto[]> {
    const obligations = await this.obligationsRepository.find({
      order: { dueDate: 'ASC' },
    });

    return obligations.map((obligation) => this.toObligationDto(obligation));
  }

  async markAsPaid(id: string): Promise<FiscalObligationDto> {
    const obligation = await this.obligationsRepository.findOne({
      where: { id },
    });

    if (!obligation) {
      throw new NotFoundException(`Obligation with id ${id} not found`);
    }

    obligation.status = ObligationStatus.PAID;
    obligation.paidAt = new Date();

    const saved = await this.obligationsRepository.save(obligation);
    return this.toObligationDto(saved);
  }

  async updateOverdueObligations(): Promise<number> {
    const today = this.startOfDay(new Date());

    const result = await this.obligationsRepository
      .createQueryBuilder()
      .update(FiscalObligation)
      .set({ status: ObligationStatus.OVERDUE })
      .where('status = :status', { status: ObligationStatus.PENDING })
      .andWhere('dueDate < :today', { today })
      .execute();

    return result.affected ?? 0;
  }

  private async sumInvoiceAmount(from: Date, to: Date): Promise<number> {
    const result = await this.invoicesRepository
      .createQueryBuilder('invoice')
      .select('COALESCE(SUM(invoice.amount), 0)', 'total')
      .where('invoice.issuedAt >= :from', { from })
      .andWhere('invoice.issuedAt <= :to', { to })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  private async findNextDas(): Promise<FiscalDashboardDto['nextDas']> {
    const obligation = await this.obligationsRepository
      .createQueryBuilder('obligation')
      .where('obligation.type = :type', { type: ObligationType.DAS })
      .andWhere('obligation.status IN (:...statuses)', {
        statuses: [ObligationStatus.PENDING, ObligationStatus.OVERDUE],
      })
      .orderBy('obligation.dueDate', 'ASC')
      .getOne();

    if (!obligation) {
      return { dueDate: null, amount: null, daysRemaining: null };
    }

    const today = this.startOfDay(new Date());
    const dueDate = this.startOfDay(obligation.dueDate);
    const daysRemaining = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      dueDate: obligation.dueDate.toISOString().split('T')[0],
      amount: Number(obligation.amount),
      daysRemaining,
    };
  }

  private toObligationDto(obligation: FiscalObligation): FiscalObligationDto {
    return {
      id: obligation.id,
      type: obligation.type,
      referencePeriod: obligation.referencePeriod,
      dueDate: obligation.dueDate.toISOString().split('T')[0],
      amount: Number(obligation.amount),
      status: obligation.status,
      paidAt: obligation.paidAt
        ? obligation.paidAt.toISOString().split('T')[0]
        : null,
    };
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
