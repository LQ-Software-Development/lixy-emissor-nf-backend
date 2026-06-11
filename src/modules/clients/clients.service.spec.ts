import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsService } from './clients.service';
import { ClientEntity } from './entities/client.entity';

describe('ClientsService', () => {
  let service: ClientsService;
  let repository: jest.Mocked<Repository<ClientEntity>>;

  const organizationId = 'org-123';
  const baseClient: ClientEntity = {
    id: 'client-1',
    organizationId,
    name: 'João da Silva',
    document: '52998224725',
    documentType: 'cpf',
    email: 'joao@email.com',
    phone: '11987654321',
    cep: '01310100',
    street: 'Avenida Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<Repository<ClientEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: getRepositoryToken(ClientEntity), useValue: repository },
      ],
    }).compile();

    service = module.get(ClientsService);
  });

  describe('create', () => {
    it('creates a client with normalized fields', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(baseClient);
      repository.save.mockResolvedValue(baseClient);

      const result = await service.create(organizationId, {
        name: 'João da Silva',
        document: '529.982.247-25',
        email: 'joao@email.com',
        phone: '(11) 98765-4321',
        cep: '01310-100',
        street: 'Avenida Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'sp',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId,
          document: '52998224725',
          documentType: 'cpf',
          cep: '01310100',
          state: 'SP',
          phone: '11987654321',
        }),
      );
      expect(result).toEqual(baseClient);
    });

    it('throws ConflictException when document already exists', async () => {
      repository.findOne.mockResolvedValue(baseClient);

      await expect(
        service.create(organizationId, {
          name: 'Outro',
          document: '529.982.247-25',
          cep: '01310-100',
          street: 'Rua A',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns paginated clients', async () => {
      repository.findAndCount.mockResolvedValue([[baseClient], 1]);

      await expect(
        service.findAll(organizationId, { page: 1, limit: 20 }),
      ).resolves.toEqual({
        data: [baseClient],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('returns client when found', async () => {
      repository.findOne.mockResolvedValue(baseClient);

      await expect(
        service.findOne(organizationId, baseClient.id),
      ).resolves.toEqual(baseClient);
    });

    it('throws NotFoundException when missing', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne(organizationId, 'missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates client fields', async () => {
      repository.findOne
        .mockResolvedValueOnce(baseClient)
        .mockResolvedValueOnce(null);
      repository.save.mockResolvedValue({ ...baseClient, name: 'Novo Nome' });

      const result = await service.update(organizationId, baseClient.id, {
        name: 'Novo Nome',
      });

      expect(repository.save).toHaveBeenCalled();
      expect(result.name).toBe('Novo Nome');
    });

    it('updates document and checks uniqueness when changed', async () => {
      const updated = {
        ...baseClient,
        document: '11444777000161',
        documentType: 'cnpj' as const,
      };
      repository.findOne
        .mockResolvedValueOnce(baseClient)
        .mockResolvedValueOnce(null);
      repository.save.mockResolvedValue(updated);

      const result = await service.update(organizationId, baseClient.id, {
        document: '11.444.777/0001-61',
      });

      expect(result.document).toBe('11444777000161');
      expect(result.documentType).toBe('cnpj');
    });

    it('updates optional address and contact fields', async () => {
      repository.findOne.mockResolvedValue(baseClient);
      repository.save.mockImplementation(async (entity) => entity as ClientEntity);

      const result = await service.update(organizationId, baseClient.id, {
        email: 'novo@email.com',
        phone: '(21) 3456-7890',
        cep: '20040-020',
        street: 'Rua da Quitanda',
        number: '50',
        complement: 'Loja 2',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'rj',
      });

      expect(result).toMatchObject({
        email: 'novo@email.com',
        phone: '2134567890',
        cep: '20040020',
        street: 'Rua da Quitanda',
        number: '50',
        complement: 'Loja 2',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
      });
    });
  });

  describe('remove', () => {
    it('removes existing client', async () => {
      repository.findOne.mockResolvedValue(baseClient);
      repository.remove.mockResolvedValue(baseClient);

      await expect(
        service.remove(organizationId, baseClient.id),
      ).resolves.toBeUndefined();
      expect(repository.remove).toHaveBeenCalledWith(baseClient);
    });
  });
});
