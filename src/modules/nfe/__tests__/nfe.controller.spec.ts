import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceStatus } from '../entities/invoice.entity';
import { NfeController } from '../nfe.controller';
import { NfeService } from '../nfe.service';

const userId = 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

const mockInvoiceResponse = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  userId,
  clientId: null,
  number: 'NF-2026-000001',
  amount: 150.5,
  description: 'Serviço',
  status: InvoiceStatus.ISSUED,
  issuedAt: '2026-06-11T00:00:00.000Z',
  cancelledAt: null,
  createdAt: '2026-06-11T00:00:00.000Z',
  updatedAt: '2026-06-11T00:00:00.000Z',
};

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
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            cancel: jest.fn(),
            generatePdf: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(NfeController);
    service = module.get(NfeService);
  });

  it('creates an invoice', async () => {
    service.create.mockResolvedValue(mockInvoiceResponse);

    await expect(
      controller.create(userId, { amount: 150.5, description: 'Serviço' }),
    ).resolves.toEqual(mockInvoiceResponse);
  });

  it('lists invoices', async () => {
    const paginated = {
      data: [mockInvoiceResponse],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
    service.findAll.mockResolvedValue(paginated);

    await expect(controller.findAll(userId, {})).resolves.toEqual(paginated);
  });

  it('returns PDF stream', async () => {
    service.generatePdf.mockResolvedValue(Buffer.from('pdf'));

    const file = await controller.downloadPdf(userId, mockInvoiceResponse.id);

    expect(file).toBeDefined();
    expect(service.generatePdf).toHaveBeenCalledWith(
      userId,
      mockInvoiceResponse.id,
    );
  });
});
