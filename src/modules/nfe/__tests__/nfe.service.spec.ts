import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../../fiscal/entities/invoice.entity';
import { NfeService } from '../nfe.service';

describe('NfeService', () => {
  let service: NfeService;
  let repository: jest.Mocked<Repository<Invoice>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NfeService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(NfeService);
    repository = module.get(getRepositoryToken(Invoice));
  });

  it('returns invoices ordered by issuedAt desc', async () => {
    const invoices = [
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        number: 'NF-001',
        amount: '1500.00',
        issuedAt: new Date('2026-06-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    repository.find.mockResolvedValue(invoices);

    await expect(service.findAll()).resolves.toEqual(invoices);
    expect(repository.find).toHaveBeenCalledWith({
      order: { issuedAt: 'DESC' },
    });
  });
});
