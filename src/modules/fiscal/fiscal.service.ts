import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiscalObligationEntity } from './entities/fiscal-obligation.entity';

@Injectable()
export class FiscalService {
  constructor(
    @InjectRepository(FiscalObligationEntity)
    private readonly obligationRepository: Repository<FiscalObligationEntity>,
  ) {}

  findAll(organizationId: string): Promise<FiscalObligationEntity[]> {
    return this.obligationRepository.find({
      where: { organizationId },
      order: { dueDate: 'ASC' },
    });
  }
}
