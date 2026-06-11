import { Test, TestingModule } from '@nestjs/testing';
import {
  ObligationStatus,
  ObligationType,
} from '../entities/fiscal-obligation.entity';
import { FiscalController } from '../fiscal.controller';
import { FiscalService } from '../fiscal.service';

describe('FiscalController', () => {
  let controller: FiscalController;
  let service: jest.Mocked<FiscalService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FiscalController],
      providers: [
        {
          provide: FiscalService,
          useValue: {
            getDashboard: jest.fn(),
            getObligations: jest.fn(),
            markAsPaid: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(FiscalController);
    service = module.get(FiscalService);
  });

  it('returns dashboard metrics', async () => {
    const dashboard = {
      monthlyRevenue: 12500.5,
      meiAnnualLimit: 81000,
      annualRevenue: 45200,
      nextDas: { dueDate: '2026-06-20', amount: 75.9, daysRemaining: 9 },
      totalInvoices: 42,
    };
    service.getDashboard.mockResolvedValue(dashboard);

    await expect(controller.getDashboard()).resolves.toEqual(dashboard);
    expect(service.getDashboard).toHaveBeenCalled();
  });

  it('returns obligations list', async () => {
    const obligations = [
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        type: ObligationType.DAS,
        referencePeriod: '2026-05',
        dueDate: '2026-06-20',
        amount: 75.9,
        status: ObligationStatus.PENDING,
        paidAt: null,
      },
    ];
    service.getObligations.mockResolvedValue(obligations);

    await expect(controller.getObligations()).resolves.toEqual(obligations);
    expect(service.getObligations).toHaveBeenCalled();
  });

  it('marks obligation as paid', async () => {
    const paid = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      type: ObligationType.DAS,
      referencePeriod: '2026-05',
      dueDate: '2026-06-20',
      amount: 75.9,
      status: ObligationStatus.PAID,
      paidAt: '2026-06-11',
    };
    service.markAsPaid.mockResolvedValue(paid);

    await expect(
      controller.markAsPaid('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ).resolves.toEqual(paid);
    expect(service.markAsPaid).toHaveBeenCalledWith(
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    );
  });
});
