import { FiscalObligation } from './entities/fiscal-obligation.entity';
import { FiscalObligationDto } from './dto/fiscal-obligation.dto';

export function toFiscalObligationDto(
  obligation: FiscalObligation,
): FiscalObligationDto {
  return {
    id: obligation.id,
    type: obligation.type,
    referencePeriod: obligation.referencePeriod,
    dueDate: obligation.dueDate,
    amount: Number(obligation.amount),
    status: obligation.status,
    paidAt: obligation.paidAt ? obligation.paidAt.toISOString() : null,
  };
}
