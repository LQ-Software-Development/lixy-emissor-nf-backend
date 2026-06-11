import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MEI_ANNUAL_LIMIT } from '../constants/fiscal.constants';
import {
  FiscalObligation,
  ObligationStatus,
  ObligationType,
} from '../entities/fiscal-obligation.entity';
import { Invoice } from '../../nfe/entities/invoice.entity';
import { FiscalService } from '../fiscal.service';

const mockObligation = (
  overrides: Partial<FiscalObligation> = {},
): FiscalObligation => ({
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  companyId: null,
  type: ObligationType.DAS,
  referencePeriod: '2026-05',
  dueDate: new Date('2026-06-20'),
  amount: '75.90',
  status: ObligationStatus.PENDING,
  paidAt: null,
  barcode: null,
  createdAt: new Date('2026-05-01'),
  updatedAt: new Date('2026-05-01'),
  ...overrides,
});

describe('FiscalService', () => {
  let service: FiscalService;
  let invoicesRepository: jest.Mocked<Repository<Invoice>>;
  let obligationsRepository: jest.Mocked<Repository<FiscalObligation>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FiscalService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FiscalObligation),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(FiscalService);
    invoicesRepository = module.get(getRepositoryToken(Invoice));
    obligationsRepository = module.get(getRepositoryToken(FiscalObligation));
  });

  describe('getDashboard', () => {
    it('returns dashboard metrics', async () => {
      const invoiceQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest
          .fn()
          .mockResolvedValueOnce({ total: '12500.50' })
          .mockResolvedValueOnce({ total: '45200.00' }),
      };

      const obligationQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockObligation()),
      };

      invoicesRepository.createQueryBuilder.mockReturnValue(
        invoiceQueryBuilder as never,
      );
      invoicesRepository.count.mockResolvedValue(42);
      obligationsRepository.createQueryBuilder.mockReturnValue(
        obligationQueryBuilder as never,
      );

      const result = await service.getDashboard();

      expect(result.monthlyRevenue).toBe(12500.5);
      expect(result.meiAnnualLimit).toBe(MEI_ANNUAL_LIMIT);
      expect(result.annualRevenue).toBe(45200);
      expect(result.totalInvoices).toBe(42);
      expect(result.nextDas).toEqual({
        dueDate: '2026-06-20',
        amount: 75.9,
        daysRemaining: expect.any(Number),
      });
    });

    it('returns null nextDas when no pending DAS exists', async () => {
      const invoiceQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
      };

      const obligationQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      invoicesRepository.createQueryBuilder.mockReturnValue(
        invoiceQueryBuilder as never,
      );
      invoicesRepository.count.mockResolvedValue(0);
      obligationsRepository.createQueryBuilder.mockReturnValue(
        obligationQueryBuilder as never,
      );

      const result = await service.getDashboard();

      expect(result.nextDas).toEqual({
        dueDate: null,
        amount: null,
        daysRemaining: null,
      });
    });
  });

  describe('getObligations', () => {
    it('returns mapped obligations', async () => {
      obligationsRepository.find.mockResolvedValue([
        mockObligation(),
        mockObligation({
          id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          type: ObligationType.DASN,
          status: ObligationStatus.PAID,
          paidAt: new Date('2026-05-10'),
        }),
      ]);

      const result = await service.getObligations();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        type: ObligationType.DAS,
        referencePeriod: '2026-05',
        dueDate: '2026-06-20',
        amount: 75.9,
        status: ObligationStatus.PENDING,
        paidAt: null,
      });
      expect(result[1].type).toBe(ObligationType.DASN);
      expect(result[1].paidAt).toBe('2026-05-10');
    });
  });

  describe('markAsPaid', () => {
    it('marks obligation as paid', async () => {
      const obligation = mockObligation();
      obligationsRepository.findOne.mockResolvedValue(obligation);
      obligationsRepository.save.mockImplementation(
        async (entity) => entity as FiscalObligation,
      );

      const result = await service.markAsPaid(obligation.id);

      expect(obligation.status).toBe(ObligationStatus.PAID);
      expect(obligation.paidAt).toBeInstanceOf(Date);
      expect(result.status).toBe(ObligationStatus.PAID);
      expect(result.paidAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('throws NotFoundException when obligation does not exist', async () => {
      obligationsRepository.findOne.mockResolvedValue(null);

      await expect(service.markAsPaid('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateOverdueObligations', () => {
    it('updates pending obligations past due date', async () => {
      const updateQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 3 }),
      };

      obligationsRepository.createQueryBuilder.mockReturnValue(
        updateQueryBuilder as never,
      );

      const affected = await service.updateOverdueObligations();

      expect(affected).toBe(3);
      expect(updateQueryBuilder.set).toHaveBeenCalledWith({
        status: ObligationStatus.OVERDUE,
      });
    });

    it('returns 0 when no obligations are updated', async () => {
      const updateQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      };

      obligationsRepository.createQueryBuilder.mockReturnValue(
        updateQueryBuilder as never,
      );

      const affected = await service.updateOverdueObligations();

      expect(affected).toBe(0);
    });
  });
});
