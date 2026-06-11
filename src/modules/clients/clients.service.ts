import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { normalizeCep } from '../../common/validators/is-cep.validator';
import {
  normalizeDocument,
  resolveDocumentType,
} from '../../common/validators/is-cpf-or-cnpj.validator';
import { stripPhoneDigits } from '../../common/validators/is-brazilian-phone.validator';
import { CreateClientDto } from './dto/create-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { PaginatedClientsDto } from './dto/paginated-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientEntity } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>,
  ) {}

  async create(
    organizationId: string,
    dto: CreateClientDto,
  ): Promise<ClientEntity> {
    const document = normalizeDocument(dto.document);
    await this.ensureDocumentIsUnique(organizationId, document);

    const client = this.clientRepository.create({
      organizationId,
      name: dto.name.trim(),
      document,
      documentType: resolveDocumentType(dto.document),
      email: dto.email?.trim().toLowerCase() ?? null,
      phone: dto.phone ? stripPhoneDigits(dto.phone) : null,
      cep: normalizeCep(dto.cep),
      street: dto.street.trim(),
      number: dto.number?.trim() ?? null,
      complement: dto.complement?.trim() ?? null,
      neighborhood: dto.neighborhood.trim(),
      city: dto.city.trim(),
      state: dto.state.trim().toUpperCase(),
    });

    return this.clientRepository.save(client);
  }

  async findAll(
    organizationId: string,
    query: ListClientsQueryDto,
  ): Promise<PaginatedClientsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.clientRepository.findAndCount({
      where: { organizationId },
      order: { name: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(organizationId: string, id: string): Promise<ClientEntity> {
    const client = await this.clientRepository.findOne({
      where: { id, organizationId },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return client;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateClientDto,
  ): Promise<ClientEntity> {
    const client = await this.findOne(organizationId, id);

    if (dto.document !== undefined) {
      const document = normalizeDocument(dto.document);
      if (document !== client.document) {
        await this.ensureDocumentIsUnique(organizationId, document, id);
      }
      client.document = document;
      client.documentType = resolveDocumentType(dto.document);
    }

    if (dto.name !== undefined) {
      client.name = dto.name.trim();
    }
    if (dto.email !== undefined) {
      client.email = dto.email?.trim().toLowerCase() ?? null;
    }
    if (dto.phone !== undefined) {
      client.phone = dto.phone ? stripPhoneDigits(dto.phone) : null;
    }
    if (dto.cep !== undefined) {
      client.cep = normalizeCep(dto.cep);
    }
    if (dto.street !== undefined) {
      client.street = dto.street.trim();
    }
    if (dto.number !== undefined) {
      client.number = dto.number?.trim() ?? null;
    }
    if (dto.complement !== undefined) {
      client.complement = dto.complement?.trim() ?? null;
    }
    if (dto.neighborhood !== undefined) {
      client.neighborhood = dto.neighborhood.trim();
    }
    if (dto.city !== undefined) {
      client.city = dto.city.trim();
    }
    if (dto.state !== undefined) {
      client.state = dto.state.trim().toUpperCase();
    }

    return this.clientRepository.save(client);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const client = await this.findOne(organizationId, id);
    await this.clientRepository.remove(client);
  }

  private async ensureDocumentIsUnique(
    organizationId: string,
    document: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.clientRepository.findOne({
      where: { organizationId, document },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Documento já cadastrado para esta organização');
    }
  }
}
