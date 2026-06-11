import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceEntity } from './entities/invoice.entity';

@Injectable()
export class NfeService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepository: Repository<InvoiceEntity>,
  ) {}

  findAll(organizationId: string): Promise<InvoiceEntity[]> {
    return this.invoiceRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }
}
