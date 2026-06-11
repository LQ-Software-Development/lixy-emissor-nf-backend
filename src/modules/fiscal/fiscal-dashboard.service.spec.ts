import { Repository } from 'typeorm';
import { FiscalDashboardService } from './fiscal-dashboard.service';
import { NotaFiscal } from './entities/nota-fiscal.entity';
import {
  FiscalObligation,
  FiscalObligationStatus,
  FiscalObligationType,
} from './entities/fiscal-obligation.entity';
import { MEI_ANNUAL_LIMIT } from './fiscal.constants';

describe('FiscalDashboardService', () => {
  let service: FiscalDashboardService;
  let notaFiscalRepository: jest.Mocked<Repository<NotaFiscal>>;
  let obligationRepository: jest.Mocked<Repository<FiscalObligation>>;

  beforeEach(() => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '1500.50' }),
    };

    notaFiscalRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      count: jest.fn().mockResolvedValue(7),
    } as unknown as jest.Mocked<Repository<NotaFiscal>>;

    const obligationQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        dueDate: '2026-06-20',
        amount: '75.90',
      }),
    };

    obligationRepository = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValue(obligationQueryBuilder),
    } as unknown as jest.Mocked<Repository<FiscalObligation>>;

    service = new FiscalDashboardService(
      notaFiscalRepository,
      obligationRepository,
    );
  });

  it('returns dashboard metrics for company', async () => {
    const result = await service.execute('company-1');

    expect(result.monthlyRevenue).toBe(1500.5);
    expect(result.annualRevenue).toBe(1500.5);
    expect(result.meiAnnualLimit).toBe(MEI_ANNUAL_LIMIT);
    expect(result.totalNfsEmitted).toBe(7);
    expect(result.nextDas).toEqual(
      expect.objectContaining({
        dueDate: '2026-06-20',
        amount: 75.9,
      }),
    );
  });

  it('uses next month when synthetic DAS due date already passed', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-25T12:00:00.000Z'));

    const obligationQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };

    obligationRepository.createQueryBuilder = jest
      .fn()
      .mockReturnValue(obligationQueryBuilder);

    const result = await service.execute('company-1');

    expect(result.nextDas?.dueDate).toBe('2026-07-20');

    jest.useRealTimers();
  });

  it('returns synthetic DAS when no obligation exists', async () => {
    const obligationQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };

    obligationRepository.createQueryBuilder = jest
      .fn()
      .mockReturnValue(obligationQueryBuilder);

    const result = await service.execute('company-1');

    expect(result.nextDas).not.toBeNull();
    expect(result.nextDas?.amount).toBe(75.9);
    expect(result.nextDas?.daysRemaining).toBeGreaterThanOrEqual(0);
  });
});
