import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../fiscal/entities/invoice.entity';

@Injectable()
export class NfeService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
  ) {}

  findAll(): Promise<Invoice[]> {
    return this.invoicesRepository.find({
      order: { issuedAt: 'DESC' },
    });
  }
}
