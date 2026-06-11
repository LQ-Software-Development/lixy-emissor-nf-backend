import { Test, TestingModule } from '@nestjs/testing';
import { NfeController } from '../nfe.controller';
import { NfeService } from '../nfe.service';

describe('NfeController', () => {
  let controller: NfeController;
  let service: jest.Mocked<NfeService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NfeController],
      providers: [
        {
          provide: NfeService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(NfeController);
    service = module.get(NfeService);
  });

  it('returns invoice list', async () => {
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
    service.findAll.mockResolvedValue(invoices);

    await expect(controller.listInvoices()).resolves.toEqual(invoices);
    expect(service.findAll).toHaveBeenCalled();
  });
});
