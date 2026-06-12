import { Test, TestingModule } from '@nestjs/testing';
import { CreateNfeInvoiceDto } from '../dto/create-nfe-invoice.dto';
import { Invoice, NfeInvoiceStatus } from '../entities/invoice.entity';
import { NfeController } from '../nfe.controller';
import { NfeService } from '../nfe.service';

const mockInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  number: '000000001',
  series: '1',
  clientId: null,
  amount: '150.00',
  status: NfeInvoiceStatus.DRAFT,
  accessKey: null,
  issuedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

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
            issue: jest.fn(),
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
    const dto: CreateNfeInvoiceDto = {
      number: '000000001',
      amount: '150.00',
    };
    const invoice = mockInvoice();

    service.create.mockResolvedValue(invoice);

    await expect(controller.create(dto)).resolves.toEqual(invoice);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('returns invoice by id', async () => {
    const invoice = mockInvoice();
    service.findOne.mockResolvedValue(invoice);

    await expect(controller.findOne(invoice.id)).resolves.toEqual(invoice);
  });

  it('lists invoices', async () => {
    const invoice = mockInvoice();
    service.findAll.mockResolvedValue({
      data: [invoice],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    await expect(controller.findAll({ page: 1, limit: 10 })).resolves.toEqual({
      data: [invoice],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('issues an invoice', async () => {
    const invoice = mockInvoice({ status: NfeInvoiceStatus.ISSUED });
    service.issue.mockResolvedValue(invoice);

    await expect(
      controller.issue(invoice.id, {
        accessKey: '35260611234567890123456789012345678901234567',
      }),
    ).resolves.toEqual(invoice);
  });

  it('cancels an invoice', async () => {
    const invoice = mockInvoice({ status: NfeInvoiceStatus.CANCELLED });
    service.cancel.mockResolvedValue(invoice);

    await expect(controller.cancel(invoice.id)).resolves.toEqual(invoice);
  });

  it('streams a PDF', async () => {
    const buffer = Buffer.from('%PDF-1.4');
    service.generatePdf.mockResolvedValue(buffer);

    const result = await controller.downloadPdf(
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    );

    expect(result).toBeDefined();
    expect(service.generatePdf).toHaveBeenCalled();
  });
});
