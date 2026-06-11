import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsService } from '../clients.service';
import { CreateClientDto } from '../dto/create-client.dto';
import { Client, ClientType } from '../entities/client.entity';
import { CepService } from '../services/cep.service';

const mockClient = (): Client => ({
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  name: 'João da Silva',
  document: '52998224725',
  type: ClientType.PF,
  email: 'joao@email.com',
  phone: '11999999999',
  zipCode: '01310100',
  street: 'Avenida Paulista',
  number: '1000',
  complement: null,
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
});

describe('ClientsService', () => {
  let service: ClientsService;
  let repository: jest.Mocked<Repository<Client>>;
  let cepService: jest.Mocked<CepService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: getRepositoryToken(Client),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            softRemove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: CepService,
          useValue: {
            lookup: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ClientsService);
    repository = module.get(getRepositoryToken(Client));
    cepService = module.get(CepService);
  });

  describe('create', () => {
    const createDto: CreateClientDto = {
      name: 'João da Silva',
      document: '52998224725',
      email: 'joao@email.com',
      phone: '11999999999',
      zipCode: '01310100',
      number: '1000',
    };

    it('creates client with CEP auto-complete', async () => {
      const client = mockClient();
      repository.findOne.mockResolvedValue(null);
      cepService.lookup.mockResolvedValue({
        zipCode: '01310100',
        street: 'Avenida Paulista',
        complement: null,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
      });
      repository.create.mockReturnValue(client);
      repository.save.mockResolvedValue(client);

      await expect(service.create(createDto)).resolves.toEqual(client);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          document: '52998224725',
          type: ClientType.PF,
          street: 'Avenida Paulista',
        }),
      );
    });

    it('throws ConflictException for duplicate document', async () => {
      repository.findOne.mockResolvedValue(mockClient());

      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws ConflictException for invalid document', async () => {
      await expect(
        service.create({ ...createDto, document: '00000000000' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns paginated clients', async () => {
      const client = mockClient();
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[client], 1]),
      };

      repository.createQueryBuilder.mockReturnValue(queryBuilder as never);

      await expect(
        service.findAll({ page: 1, limit: 10, search: 'João' }),
      ).resolves.toEqual({
        data: [client],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(client.name ILIKE :search OR client.document ILIKE :search)',
        { search: '%João%' },
      );
    });

    it('filters by client type', async () => {
      const client = mockClient();
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[client], 1]),
      };

      repository.createQueryBuilder.mockReturnValue(queryBuilder as never);

      await service.findAll({ type: ClientType.PF });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'client.type = :type',
        { type: ClientType.PF },
      );
    });
  });

  describe('findOne', () => {
    it('returns client by id', async () => {
      const client = mockClient();
      repository.findOne.mockResolvedValue(client);

      await expect(service.findOne(client.id)).resolves.toEqual(client);
    });

    it('throws NotFoundException when client does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates client without changing document', async () => {
      const client = mockClient();
      repository.findOne.mockResolvedValue(client);
      repository.save.mockResolvedValue({ ...client, name: 'Updated Name' });

      const result = await service.update(client.id, { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(repository.save).toHaveBeenCalled();
    });

    it('auto-completes address when zipCode changes', async () => {
      const client = mockClient();
      repository.findOne.mockResolvedValue(client);
      cepService.lookup.mockResolvedValue({
        zipCode: '04538133',
        street: 'Rua Funchal',
        complement: 'Sala 1',
        neighborhood: 'Vila Olímpia',
        city: 'São Paulo',
        state: 'SP',
      });
      repository.save.mockImplementation(async (entity) => entity as Client);

      const result = await service.update(client.id, {
        zipCode: '04538133',
        number: '200',
      });

      expect(result.zipCode).toBe('04538133');
      expect(result.street).toBe('Rua Funchal');
      expect(result.neighborhood).toBe('Vila Olímpia');
    });

    it('updates zipCode when CEP lookup returns null', async () => {
      const client = mockClient();
      repository.findOne.mockResolvedValue(client);
      cepService.lookup.mockResolvedValue(null);
      repository.save.mockImplementation(async (entity) => entity as Client);

      const result = await service.update(client.id, {
        zipCode: '04538133',
        street: 'Custom Street',
        neighborhood: 'Custom Neighborhood',
        city: 'São Paulo',
        state: 'SP',
      });

      expect(result.zipCode).toBe('04538133');
      expect(result.street).toBe('Custom Street');
    });

    it('updates optional fields individually', async () => {
      const client = mockClient();
      repository.findOne.mockResolvedValue(client);
      repository.save.mockImplementation(async (entity) => entity as Client);

      const result = await service.update(client.id, {
        email: 'new@email.com',
        phone: '11888888888',
        complement: 'Apto 2',
        number: '500',
      });

      expect(result.email).toBe('new@email.com');
      expect(result.phone).toBe('11888888888');
      expect(result.complement).toBe('Apto 2');
      expect(result.number).toBe('500');
    });
  });

  describe('remove', () => {
    it('soft deletes client', async () => {
      const client = mockClient();
      repository.findOne.mockResolvedValue(client);
      repository.softRemove.mockResolvedValue(client);

      await service.remove(client.id);

      expect(repository.softRemove).toHaveBeenCalledWith(client);
    });
  });

  describe('lookupCep', () => {
    it('returns CEP data', async () => {
      const cepData = {
        zipCode: '01310100',
        street: 'Avenida Paulista',
        complement: null,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
      };
      cepService.lookup.mockResolvedValue(cepData);

      await expect(service.lookupCep('01310100')).resolves.toEqual(cepData);
    });

    it('throws NotFoundException for unknown CEP', async () => {
      cepService.lookup.mockResolvedValue(null);

      await expect(service.lookupCep('99999999')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
