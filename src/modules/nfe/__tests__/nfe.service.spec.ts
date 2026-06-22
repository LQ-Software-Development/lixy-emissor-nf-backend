import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, ClientType } from '../../clients/entities/client.entity';
import { ClientsService } from '../../clients/clients.service';
import { EmailService } from '../../notifications/services/email.service';
import { CreateNfeInvoiceDto } from '../dto/create-nfe-invoice.dto';
import { Invoice, NfeInvoiceStatus } from '../entities/invoice.entity';
import { NfeService } from '../nfe.service';

const CLIENT_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const INVOICE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

const mockClient = (overrides: Partial<Client> = {}): Client => ({
  id: CLIENT_ID,
  name: 'Cliente Teste',
  document: '12345678901',
  type: ClientType.PF,
  email: 'cliente@example.com',
  phone: null,
  zipCode: '01310100',
  street: 'Av Paulista',
  number: '1000',
  complement: null,
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
  ...overrides,
});

const mockInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: INVOICE_ID,
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
  ...overrides,
});

describe('NfeService', () => {
  let service: NfeService;
  let repository: jest.Mocked<Repository<Invoice>>;
  let clientsService: jest.Mocked<ClientsService>;
  let emailService: jest.Mocked<EmailService>;
  let transactionManager: {
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(async () => {
    transactionManager = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
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
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getDataSourceToken(),
          useValue: {
            transaction: jest.fn((callback: (manager: unknown) => unknown) =>
              callback(transactionManager),
            ),
          },
        },
        {
          provide: ClientsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            isConfigured: jest.fn(),
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(NfeService);
    repository = module.get(getRepositoryToken(Invoice));
    clientsService = module.get(ClientsService);
    emailService = module.get(EmailService);
  });

  describe('create', () => {
    const dto: CreateNfeInvoiceDto = {
      clientId: CLIENT_ID,
      description: 'Serviço de consultoria',
      amount: '150.00',
    };

    it('creates an issued invoice with auto-generated number on empty table', async () => {
      const client = mockClient();
      const created = mockInvoice();

      clientsService.findOne.mockResolvedValue(client);
      transactionManager.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxNumber: null }),
      });
      transactionManager.create.mockReturnValue(created);
      transactionManager.save.mockResolvedValue(created);
      emailService.isConfigured.mockReturnValue(true);
      emailService.send.mockResolvedValue(true);

      await expect(service.create(dto)).resolves.toEqual(created);

      expect(transactionManager.create).toHaveBeenCalledWith(
        Invoice,
        expect.objectContaining({
          number: '000000001',
          series: '1',
          status: NfeInvoiceStatus.ISSUED,
          description: dto.description,
          clientId: dto.clientId,
        }),
      );
      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: client.email,
          subject: `Nota Fiscal #${created.number}`,
        }),
      );
    });

    it('increments the highest existing invoice number', async () => {
      const client = mockClient();
      const created = mockInvoice({ number: '000000042' });

      clientsService.findOne.mockResolvedValue(client);
      transactionManager.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxNumber: '41' }),
      });
      transactionManager.create.mockReturnValue(created);
      transactionManager.save.mockResolvedValue(created);
      emailService.isConfigured.mockReturnValue(false);

      await service.create(dto);

      expect(transactionManager.create).toHaveBeenCalledWith(
        Invoice,
        expect.objectContaining({ number: '000000042' }),
      );
      expect(emailService.send).not.toHaveBeenCalled();
    });

    it('does not fail when email is not configured', async () => {
      const client = mockClient();
      const created = mockInvoice();

      clientsService.findOne.mockResolvedValue(client);
      transactionManager.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxNumber: null }),
      });
      transactionManager.create.mockReturnValue(created);
      transactionManager.save.mockResolvedValue(created);
      emailService.isConfigured.mockReturnValue(false);

      await expect(service.create(dto)).resolves.toEqual(created);
      expect(emailService.send).not.toHaveBeenCalled();
    });

    it('does not fail when client has no email', async () => {
      const client = mockClient({ email: null });
      const created = mockInvoice();

      clientsService.findOne.mockResolvedValue(client);
      transactionManager.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxNumber: null }),
      });
      transactionManager.create.mockReturnValue(created);
      transactionManager.save.mockResolvedValue(created);
      emailService.isConfigured.mockReturnValue(true);

      await expect(service.create(dto)).resolves.toEqual(created);
      expect(emailService.send).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns paginated invoices', async () => {
      const invoices = [mockInvoice()];
      const queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([invoices, 1]),
      };

      repository.createQueryBuilder.mockReturnValue(
        queryBuilder as unknown as ReturnType<
          Repository<Invoice>['createQueryBuilder']
        >,
      );

      await expect(service.findAll({ page: 1, limit: 10 })).resolves.toEqual({
        data: invoices,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('throws when invoice is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('send', () => {
    it('re-sends invoice email successfully', async () => {
      const invoice = mockInvoice();
      const client = mockClient();

      repository.findOne.mockResolvedValue(invoice);
      clientsService.findOne.mockResolvedValue(client);
      emailService.isConfigured.mockReturnValue(true);
      emailService.send.mockResolvedValue(true);

      await expect(service.send(invoice.id)).resolves.toEqual({
        success: true,
      });
    });

    it('returns success false when client has no email', async () => {
      const invoice = mockInvoice();
      const client = mockClient({ email: null });

      repository.findOne.mockResolvedValue(invoice);
      clientsService.findOne.mockResolvedValue(client);
      emailService.isConfigured.mockReturnValue(true);

      await expect(service.send(invoice.id)).resolves.toEqual({
        success: false,
      });
    });

    it('returns success false when email is not configured', async () => {
      const invoice = mockInvoice();
      const client = mockClient();

      repository.findOne.mockResolvedValue(invoice);
      clientsService.findOne.mockResolvedValue(client);
      emailService.isConfigured.mockReturnValue(false);

      await expect(service.send(invoice.id)).resolves.toEqual({
        success: false,
      });
    });
  });

  describe('cancel', () => {
    it('cancels an issued invoice', async () => {
      const issued = mockInvoice({ status: NfeInvoiceStatus.ISSUED });
      const cancelled = mockInvoice({ status: NfeInvoiceStatus.CANCELLED });

      repository.findOne.mockResolvedValue(issued);
      repository.save.mockResolvedValue(cancelled);

      await expect(service.cancel(issued.id)).resolves.toEqual(cancelled);
    });

    it('rejects cancelling a non-issued invoice', async () => {
      repository.findOne.mockResolvedValue(
        mockInvoice({ status: NfeInvoiceStatus.CANCELLED }),
      );

      await expect(service.cancel(INVOICE_ID)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('generatePdf', () => {
    it('generates a PDF buffer including description', async () => {
      const invoice = mockInvoice();
      const client = mockClient();

      repository.findOne.mockResolvedValue(invoice);
      clientsService.findOne.mockResolvedValue(client);

      const buffer = await service.generatePdf(INVOICE_ID);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    });
  });
});
