import { Repository } from 'typeorm';
import { ListObligationsService } from './list-obligations.service';
import {
  FiscalObligation,
  FiscalObligationStatus,
  FiscalObligationType,
} from './entities/fiscal-obligation.entity';

describe('ListObligationsService', () => {
  let service: ListObligationsService;
  let obligationRepository: jest.Mocked<Repository<FiscalObligation>>;

  beforeEach(() => {
    obligationRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'obl-1',
          companyId: 'company-1',
          type: FiscalObligationType.DAS,
          referencePeriod: '2026-05',
          dueDate: '2026-06-20',
          amount: '75.90',
          status: FiscalObligationStatus.PENDING,
          paidAt: null,
        },
      ]),
    } as unknown as jest.Mocked<Repository<FiscalObligation>>;

    service = new ListObligationsService(obligationRepository);
  });

  it('lists obligations for tenant', async () => {
    const result = await service.execute('company-1');

    expect(obligationRepository.find).toHaveBeenCalledWith({
      where: { companyId: 'company-1' },
      order: { dueDate: 'DESC' },
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'obl-1',
        type: FiscalObligationType.DAS,
        amount: 75.9,
      }),
    );
  });
});
