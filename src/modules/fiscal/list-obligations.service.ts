import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiscalObligationDto } from './dto/fiscal-obligation.dto';
import { FiscalObligation } from './entities/fiscal-obligation.entity';
import { toFiscalObligationDto } from './fiscal.mapper';

@Injectable()
export class ListObligationsService {
  constructor(
    @InjectRepository(FiscalObligation)
    private readonly obligationRepository: Repository<FiscalObligation>,
  ) {}

  async execute(companyId: string): Promise<FiscalObligationDto[]> {
    const obligations = await this.obligationRepository.find({
      where: { companyId },
      order: { dueDate: 'DESC' },
    });

    return obligations.map(toFiscalObligationDto);
  }
}
