import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClientDto } from './dto/create-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client, ClientType } from './entities/client.entity';
import { CepService } from './services/cep.service';
import {
  getDocumentType,
  stripNonDigits,
} from './validators/document.validator';

export type PaginatedClientsResult = {
  data: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    private readonly cepService: CepService,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const document = stripNonDigits(createClientDto.document);
    const documentType = getDocumentType(document);

    if (!documentType) {
      throw new ConflictException('Invalid document');
    }

    const existing = await this.clientsRepository.findOne({
      where: { document },
      withDeleted: true,
    });

    if (existing) {
      throw new ConflictException('Client with this document already exists');
    }

    const cepData = await this.cepService.lookup(createClientDto.zipCode);

    const client = this.clientsRepository.create({
      name: createClientDto.name,
      document,
      type: documentType as ClientType,
      email: createClientDto.email ?? null,
      phone: createClientDto.phone ?? null,
      zipCode: createClientDto.zipCode.replace(/\D/g, ''),
      street: createClientDto.street ?? cepData?.street ?? '',
      number: createClientDto.number,
      complement: createClientDto.complement ?? cepData?.complement ?? null,
      neighborhood: createClientDto.neighborhood ?? cepData?.neighborhood ?? '',
      city: createClientDto.city ?? cepData?.city ?? '',
      state: createClientDto.state ?? cepData?.state ?? '',
    });

    return this.clientsRepository.save(client);
  }

  async findAll(query: QueryClientsDto): Promise<PaginatedClientsResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.clientsRepository
      .createQueryBuilder('client')
      .where('client.deletedAt IS NULL');

    if (query.search) {
      const search = `%${query.search}%`;
      queryBuilder.andWhere(
        '(client.name ILIKE :search OR client.document ILIKE :search)',
        { search },
      );
    }

    if (query.type) {
      queryBuilder.andWhere('client.type = :type', { type: query.type });
    }

    const [data, total] = await queryBuilder
      .orderBy('client.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientsRepository.findOne({ where: { id } });

    if (!client) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }

    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);

    if (updateClientDto.zipCode) {
      const cepData = await this.cepService.lookup(updateClientDto.zipCode);

      if (cepData) {
        client.zipCode = cepData.zipCode;
        client.street = updateClientDto.street ?? cepData.street;
        client.complement =
          updateClientDto.complement ?? cepData.complement ?? null;
        client.neighborhood =
          updateClientDto.neighborhood ?? cepData.neighborhood;
        client.city = updateClientDto.city ?? cepData.city;
        client.state = updateClientDto.state ?? cepData.state;
      } else {
        client.zipCode = updateClientDto.zipCode.replace(/\D/g, '');
      }
    }

    if (updateClientDto.name !== undefined) {
      client.name = updateClientDto.name;
    }

    if (updateClientDto.email !== undefined) {
      client.email = updateClientDto.email;
    }

    if (updateClientDto.phone !== undefined) {
      client.phone = updateClientDto.phone;
    }

    if (updateClientDto.street !== undefined) {
      client.street = updateClientDto.street;
    }

    if (updateClientDto.number !== undefined) {
      client.number = updateClientDto.number;
    }

    if (updateClientDto.complement !== undefined) {
      client.complement = updateClientDto.complement;
    }

    if (updateClientDto.neighborhood !== undefined) {
      client.neighborhood = updateClientDto.neighborhood;
    }

    if (updateClientDto.city !== undefined) {
      client.city = updateClientDto.city;
    }

    if (updateClientDto.state !== undefined) {
      client.state = updateClientDto.state;
    }

    return this.clientsRepository.save(client);
  }

  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);
    await this.clientsRepository.softRemove(client);
  }

  async lookupCep(cep: string) {
    const result = await this.cepService.lookup(cep);

    if (!result) {
      throw new NotFoundException('CEP not found');
    }

    return result;
  }
}
