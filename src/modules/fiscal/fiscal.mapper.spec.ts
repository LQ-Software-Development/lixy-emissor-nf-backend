import { toFiscalObligationDto } from './fiscal.mapper';
import {
  FiscalObligationStatus,
  FiscalObligationType,
} from './entities/fiscal-obligation.entity';

describe('toFiscalObligationDto', () => {
  it('maps entity to dto', () => {
    const paidAt = new Date('2026-06-01T12:00:00.000Z');

    const dto = toFiscalObligationDto({
      id: 'obl-1',
      companyId: 'company-1',
      type: FiscalObligationType.DASN,
      referencePeriod: '2025',
      dueDate: '2026-05-31',
      amount: '0.00',
      status: FiscalObligationStatus.PAID,
      paidAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(dto).toEqual({
      id: 'obl-1',
      type: FiscalObligationType.DASN,
      referencePeriod: '2025',
      dueDate: '2026-05-31',
      amount: 0,
      status: FiscalObligationStatus.PAID,
      paidAt: paidAt.toISOString(),
    });
  });
});
