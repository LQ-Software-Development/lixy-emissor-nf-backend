import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNfeInvoiceDto } from '../dto/create-nfe-invoice.dto';
import { Invoice, NfeInvoiceStatus } from '../entities/invoice.entity';
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
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(NfeService);
    repository = module.get(getRepositoryToken(Invoice));
  });

  it('creates a draft invoice', async () => {
    const dto: CreateNfeInvoiceDto = {
      number: '000000001',
      amount: '150.00',
    };
    const created = mockInvoice();

    repository.create.mockReturnValue(created);
    repository.save.mockResolvedValue(created);

    await expect(service.create(dto)).resolves.toEqual(created);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        number: '000000001',
        status: NfeInvoiceStatus.DRAFT,
      }),
    );
  });

  it('throws when invoice is not found', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('issues a draft invoice', async () => {
    const draft = mockInvoice();
    const issued = mockInvoice({
      status: NfeInvoiceStatus.ISSUED,
      accessKey: '35260611234567890123456789012345678901234567',
      issuedAt: new Date('2024-06-01'),
    });

    repository.findOne.mockResolvedValue(draft);
    repository.save.mockResolvedValue(issued);

    await expect(service.issue(draft.id, issued.accessKey!)).resolves.toEqual(
      issued,
    );
  });

  it('rejects issuing a non-draft invoice', async () => {
    repository.findOne.mockResolvedValue(
      mockInvoice({ status: NfeInvoiceStatus.ISSUED }),
    );

    await expect(
      service.issue('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1'.repeat(44)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cancels an issued invoice', async () => {
    const issued = mockInvoice({ status: NfeInvoiceStatus.ISSUED });
    const cancelled = mockInvoice({ status: NfeInvoiceStatus.CANCELLED });

    repository.findOne.mockResolvedValue(issued);
    repository.save.mockResolvedValue(cancelled);

    await expect(service.cancel(issued.id)).resolves.toEqual(cancelled);
  });

  it('rejects cancelling a non-issued invoice', async () => {
    repository.findOne.mockResolvedValue(
      mockInvoice({ status: NfeInvoiceStatus.DRAFT }),
    );

    await expect(
      service.cancel('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists invoices with optional filters', async () => {
    const invoice = mockInvoice();
    const queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[invoice], 1]),
    };

    repository.createQueryBuilder.mockReturnValue(queryBuilder as never);

    const result = await service.findAll({
      page: 1,
      limit: 10,
      status: NfeInvoiceStatus.DRAFT,
      clientId: 'client-1',
    });

    expect(result).toEqual({
      data: [invoice],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledTimes(2);
  });

  it('generates a PDF buffer', async () => {
    repository.findOne.mockResolvedValue(mockInvoice());

    const buffer = await service.generatePdf(
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    );

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('generates a PDF with access key and issued date', async () => {
    repository.findOne.mockResolvedValue(
      mockInvoice({
        status: NfeInvoiceStatus.ISSUED,
        accessKey: '35260611234567890123456789012345678901234567',
        issuedAt: new Date('2024-06-01'),
      }),
    );

    const buffer = await service.generatePdf(
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    );

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
