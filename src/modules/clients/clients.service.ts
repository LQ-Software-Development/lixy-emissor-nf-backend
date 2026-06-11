import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientEntity } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>,
  ) {}

  findAll(organizationId: string): Promise<ClientEntity[]> {
    return this.clientRepository.find({
      where: { organizationId },
      order: { name: 'ASC' },
    });
  }
}
