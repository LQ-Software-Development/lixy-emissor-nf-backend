import { FiscalController } from './fiscal.controller';
import { FiscalDashboardService } from './fiscal-dashboard.service';
import { ListObligationsService } from './list-obligations.service';
import { PayObligationService } from './pay-obligation.service';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { MEI_ANNUAL_LIMIT } from './fiscal.constants';
import {
  FiscalObligationStatus,
  FiscalObligationType,
} from './entities/fiscal-obligation.entity';

describe('FiscalController', () => {
  const dashboardService = {
    execute: jest.fn(),
  } as unknown as FiscalDashboardService;

  const listObligationsService = {
    execute: jest.fn(),
  } as unknown as ListObligationsService;

  const payObligationService = {
    execute: jest.fn(),
  } as unknown as PayObligationService;

  const controller = new FiscalController(
    dashboardService,
    listObligationsService,
    payObligationService,
  );

  const request = { companyId: 'company-1' } as AuthenticatedRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates dashboard to service', async () => {
    (dashboardService.execute as jest.Mock).mockResolvedValue({
      monthlyRevenue: 1000,
      meiAnnualLimit: MEI_ANNUAL_LIMIT,
      annualRevenue: 5000,
      nextDas: null,
      totalNfsEmitted: 3,
    });

    const result = await controller.getDashboard(request);

    expect(dashboardService.execute).toHaveBeenCalledWith('company-1');
    expect(result.totalNfsEmitted).toBe(3);
  });

  it('delegates obligations list to service', async () => {
    (listObligationsService.execute as jest.Mock).mockResolvedValue([]);

    await controller.listObligations(request);

    expect(listObligationsService.execute).toHaveBeenCalledWith('company-1');
  });

  it('delegates pay obligation to service', async () => {
    (payObligationService.execute as jest.Mock).mockResolvedValue({
      obligation: {
        id: 'obl-1',
        type: FiscalObligationType.DAS,
        referencePeriod: '2026-05',
        dueDate: '2026-06-20',
        amount: 75.9,
        status: FiscalObligationStatus.PAID,
        paidAt: new Date().toISOString(),
      },
    });

    const result = await controller.payObligation(request, 'obl-1');

    expect(payObligationService.execute).toHaveBeenCalledWith(
      'company-1',
      'obl-1',
    );
    expect(result.obligation.status).toBe(FiscalObligationStatus.PAID);
  });
});
