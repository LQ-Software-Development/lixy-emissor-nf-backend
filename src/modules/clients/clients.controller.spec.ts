import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ViaCepService } from '../../common/services/viacep.service';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ClientEntity } from './entities/client.entity';

describe('ClientsController', () => {
  let controller: ClientsController;
  let clientsService: jest.Mocked<ClientsService>;
  let viaCepService: jest.Mocked<ViaCepService>;

  const organizationId = 'org-123';
  const client: ClientEntity = {
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
    clientsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<ClientsService>;

    viaCepService = {
      lookup: jest.fn(),
    } as unknown as jest.Mocked<ViaCepService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        { provide: ClientsService, useValue: clientsService },
        { provide: ViaCepService, useValue: viaCepService },
      ],
    }).compile();

    controller = module.get(ClientsController);
  });

  it('creates a client', async () => {
    clientsService.create.mockResolvedValue(client);

    const dto = {
      name: 'João da Silva',
      document: '529.982.247-25',
      cep: '01310-100',
      street: 'Avenida Paulista',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    };

    await expect(controller.create(organizationId, dto)).resolves.toEqual(
      client,
    );
    expect(clientsService.create).toHaveBeenCalledWith(organizationId, dto);
  });

  it('lists clients with pagination', async () => {
    const paginated = {
      data: [client],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
    clientsService.findAll.mockResolvedValue(paginated);

    await expect(
      controller.findAll(organizationId, { page: 1, limit: 20 }),
    ).resolves.toEqual(paginated);
  });

  it('looks up address by CEP', async () => {
    const address = {
      cep: '01310100',
      street: 'Avenida Paulista',
      complement: '',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    };
    viaCepService.lookup.mockResolvedValue(address);

    await expect(controller.lookupAddress('01310-100')).resolves.toEqual(
      address,
    );
  });

  it('rejects invalid CEP on lookup', async () => {
    await expect(controller.lookupAddress('invalid')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('gets client by id', async () => {
    clientsService.findOne.mockResolvedValue(client);

    await expect(
      controller.findOne(organizationId, client.id),
    ).resolves.toEqual(client);
  });

  it('updates client', async () => {
    clientsService.update.mockResolvedValue({ ...client, name: 'Novo' });

    await expect(
      controller.update(organizationId, client.id, { name: 'Novo' }),
    ).resolves.toEqual({ ...client, name: 'Novo' });
  });

  it('removes client', async () => {
    clientsService.remove.mockResolvedValue(undefined);

    await expect(
      controller.remove(organizationId, client.id),
    ).resolves.toBeUndefined();
  });
});
