import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsService } from './clients.service';
import { ClientEntity } from './entities/client.entity';

describe('ClientsService document conflict on update', () => {
  it('throws ConflictException when new document belongs to another client', async () => {
    const baseClient: ClientEntity = {
      id: 'client-1',
      organizationId: 'org-123',
      name: 'João',
      document: '52998224725',
      documentType: 'cpf',
      email: null,
      phone: null,
      cep: '01310100',
      street: 'Rua A',
      number: null,
      complement: null,
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const findOne = jest
      .fn()
      .mockResolvedValueOnce(baseClient)
      .mockResolvedValueOnce({ ...baseClient, id: 'client-2' });

    const repository = {
      findOne,
      save: jest.fn(),
    } as unknown as Repository<ClientEntity>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: getRepositoryToken(ClientEntity), useValue: repository },
      ],
    }).compile();

    const service = module.get(ClientsService);

    await expect(
      service.update('org-123', 'client-1', {
        document: '11.444.777/0001-61',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(findOne).toHaveBeenCalledTimes(2);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
