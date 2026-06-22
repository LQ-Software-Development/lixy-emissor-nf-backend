import { Test, TestingModule } from '@nestjs/testing';
import { CreateNfeInvoiceDto } from '../dto/create-nfe-invoice.dto';
import { Invoice, NfeInvoiceStatus } from '../entities/invoice.entity';
import { NfeController } from '../nfe.controller';
import { NfeService } from '../nfe.service';

const CLIENT_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

const mockInvoice = (): Invoice => ({
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  number: '000000001',
  series: '1',
  clientId: CLIENT_ID,
  description: 'Serviço de consultoria',
  amount: '150.00',
  status: NfeInvoiceStatus.ISSUED,
  accessKey: null,
  issuedAt: new Date('2024-06-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
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
            send: jest.fn(),
            cancel: jest.fn(),
            generatePdf: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(NfeController);
    service = module.get(NfeService);
  });

  it('creates and emits an invoice', async () => {
    const dto: CreateNfeInvoiceDto = {
      clientId: CLIENT_ID,
      description: 'Serviço de consultoria',
      amount: '150.00',
    };
    const invoice = mockInvoice();

    service.create.mockResolvedValue(invoice);

    await expect(controller.create(dto)).resolves.toEqual(invoice);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('lists invoices', async () => {
    const result = {
      data: [mockInvoice()],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    service.findAll.mockResolvedValue(result);

    await expect(controller.findAll({})).resolves.toEqual(result);
  });

  it('returns invoice by id', async () => {
    const invoice = mockInvoice();
    service.findOne.mockResolvedValue(invoice);

    await expect(controller.findOne(invoice.id)).resolves.toEqual(invoice);
  });

  it('re-sends invoice email', async () => {
    service.send.mockResolvedValue({ success: true });

    await expect(
      controller.send('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ).resolves.toEqual({ success: true });
  });

  it('cancels an invoice', async () => {
    const invoice = mockInvoice();
    const cancelled = { ...invoice, status: NfeInvoiceStatus.CANCELLED };

    service.cancel.mockResolvedValue(cancelled);

    await expect(controller.cancel(invoice.id)).resolves.toEqual(cancelled);
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
