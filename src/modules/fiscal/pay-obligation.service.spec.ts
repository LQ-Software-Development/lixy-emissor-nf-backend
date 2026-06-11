import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PayObligationService } from './pay-obligation.service';
import {
  FiscalObligation,
  FiscalObligationStatus,
  FiscalObligationType,
} from './entities/fiscal-obligation.entity';

describe('PayObligationService', () => {
  let service: PayObligationService;
  let obligationRepository: jest.Mocked<Repository<FiscalObligation>>;

  const obligation: FiscalObligation = {
    id: 'obl-1',
    companyId: 'company-1',
    type: FiscalObligationType.DAS,
    referencePeriod: '2026-05',
    dueDate: '2026-06-20',
    amount: '75.90',
    status: FiscalObligationStatus.PENDING,
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    obligationRepository = {
      findOne: jest.fn().mockResolvedValue({ ...obligation }),
      save: jest.fn().mockImplementation(async (entity) => entity),
    } as unknown as jest.Mocked<Repository<FiscalObligation>>;

    service = new PayObligationService(obligationRepository);
  });

  it('marks obligation as paid', async () => {
    const result = await service.execute('company-1', 'obl-1');

    expect(obligationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: FiscalObligationStatus.PAID,
        paidAt: expect.any(Date),
      }),
    );
    expect(result.obligation.status).toBe(FiscalObligationStatus.PAID);
    expect(result.obligation.paidAt).not.toBeNull();
  });

  it('throws when obligation is not found', async () => {
    obligationRepository.findOne.mockResolvedValue(null);

    await expect(service.execute('company-1', 'missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
