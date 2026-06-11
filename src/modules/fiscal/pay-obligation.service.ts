import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayObligationResponseDto } from './dto/fiscal-obligation.dto';
import {
  FiscalObligation,
  FiscalObligationStatus,
} from './entities/fiscal-obligation.entity';
import { toFiscalObligationDto } from './fiscal.mapper';

@Injectable()
export class PayObligationService {
  constructor(
    @InjectRepository(FiscalObligation)
    private readonly obligationRepository: Repository<FiscalObligation>,
  ) {}

  async execute(
    companyId: string,
    obligationId: string,
  ): Promise<PayObligationResponseDto> {
    const obligation = await this.obligationRepository.findOne({
      where: { id: obligationId, companyId },
    });

    if (!obligation) {
      throw new NotFoundException('Obrigação fiscal não encontrada');
    }

    obligation.status = FiscalObligationStatus.PAID;
    obligation.paidAt = new Date();

    const saved = await this.obligationRepository.save(obligation);

    return { obligation: toFiscalObligationDto(saved) };
  }
}
