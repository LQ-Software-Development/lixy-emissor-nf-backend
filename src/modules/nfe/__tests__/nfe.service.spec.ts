import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { NfeService } from '../nfe.service';

const userId = 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

const mockInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  userId,
  clientId: null,
  number: 'NF-2026-000001',
  amount: '150.50',
  description: 'Serviço',
  status: InvoiceStatus.ISSUED,
  issuedAt: new Date('2026-06-11'),
  cancelledAt: null,
  createdAt: new Date('2026-06-11'),
  updatedAt: new Date('2026-06-11'),
  ...overrides,
});

describe('NfeService', () => {
  let service: NfeService;
  let invoicesRepository: jest.Mocked<Repository<Invoice>>;
  let clientsRepository: jest.Mocked<Repository<Client>>;
  let invoiceQueryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    getManyAndCount: jest.Mock;
    getOne: jest.Mock;
  };

  beforeEach(async () => {
    invoiceQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      getOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NfeService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(invoiceQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Client),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(NfeService);
    invoicesRepository = module.get(getRepositoryToken(Invoice));
    clientsRepository = module.get(getRepositoryToken(Client));
  });

  it('creates an invoice with generated number', async () => {
    const invoice = mockInvoice();
    invoiceQueryBuilder.getOne.mockResolvedValue(null);
    invoicesRepository.create.mockReturnValue(invoice);
    invoicesRepository.save.mockResolvedValue(invoice);

    const result = await service.create(userId, {
      amount: 150.5,
      description: 'Serviço',
    });

    expect(result.number).toBe('NF-2026-000001');
    expect(result.amount).toBe(150.5);
    expect(invoicesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        amount: '150.50',
        status: InvoiceStatus.ISSUED,
      }),
    );
  });

  it('throws when client does not exist', async () => {
    clientsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create(userId, {
        amount: 100,
        clientId: 'missing-client',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('lists invoices for the authenticated user', async () => {
    invoiceQueryBuilder.getManyAndCount.mockResolvedValue([[mockInvoice()], 1]);

    const result = await service.findAll(userId, { page: 1, limit: 10 });

    expect(result.total).toBe(1);
    expect(result.data[0].number).toBe('NF-2026-000001');
    expect(invoiceQueryBuilder.where).toHaveBeenCalledWith(
      'invoice.userId = :userId',
      { userId },
    );
  });

  it('cancels an issued invoice', async () => {
    const invoice = mockInvoice();
    invoicesRepository.findOne.mockResolvedValue(invoice);
    invoicesRepository.save.mockImplementation(
      async (entity) => entity as Invoice,
    );

    const result = await service.cancel(userId, invoice.id);

    expect(result.status).toBe(InvoiceStatus.CANCELLED);
    expect(result.cancelledAt).not.toBeNull();
  });

  it('rejects cancelling an already cancelled invoice', async () => {
    invoicesRepository.findOne.mockResolvedValue(
      mockInvoice({ status: InvoiceStatus.CANCELLED }),
    );

    await expect(service.cancel(userId, 'invoice-id')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('generates a PDF buffer for an invoice', async () => {
    invoicesRepository.findOne.mockResolvedValue(mockInvoice());

    const pdf = await service.generatePdf(userId, 'invoice-id');

    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.length).toBeGreaterThan(0);
  });
});
