import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from '../clients.controller';
import { ClientsService } from '../clients.service';
import { Client, ClientType } from '../entities/client.entity';

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

describe('ClientsController', () => {
  let controller: ClientsController;
  let service: jest.Mocked<ClientsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        {
          provide: ClientsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            lookupCep: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ClientsController);
    service = module.get(ClientsService);
  });

  it('creates a client', async () => {
    const client = mockClient();
    service.create.mockResolvedValue(client);

    await expect(
      controller.create({
        name: client.name,
        document: client.document,
        zipCode: client.zipCode,
        number: client.number,
      }),
    ).resolves.toEqual(client);
  });

  it('lists clients', async () => {
    const paginated = {
      data: [mockClient()],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
    service.findAll.mockResolvedValue(paginated);

    await expect(controller.findAll({})).resolves.toEqual(paginated);
  });

  it('gets client by id', async () => {
    const client = mockClient();
    service.findOne.mockResolvedValue(client);

    await expect(controller.findOne(client.id)).resolves.toEqual(client);
  });

  it('updates client', async () => {
    const client = mockClient();
    service.update.mockResolvedValue({ ...client, name: 'Updated' });

    await expect(
      controller.update(client.id, { name: 'Updated' }),
    ).resolves.toEqual({ ...client, name: 'Updated' });
  });

  it('removes client', async () => {
    const client = mockClient();
    service.remove.mockResolvedValue(undefined);

    await expect(controller.remove(client.id)).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(client.id);
  });

  it('looks up CEP', async () => {
    const cepData = {
      zipCode: '01310100',
      street: 'Avenida Paulista',
      complement: null,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    };
    service.lookupCep.mockResolvedValue(cepData);

    await expect(controller.lookupCep('01310100')).resolves.toEqual(cepData);
  });
});
