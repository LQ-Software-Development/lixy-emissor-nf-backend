import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { AuthGuard } from '../src/common/guards/auth.guard';
import { FiscalController } from '../src/modules/fiscal/fiscal.controller';
import { FiscalDashboardService } from '../src/modules/fiscal/fiscal-dashboard.service';
import { ListObligationsService } from '../src/modules/fiscal/list-obligations.service';
import { PayObligationService } from '../src/modules/fiscal/pay-obligation.service';
import { MEI_ANNUAL_LIMIT } from '../src/modules/fiscal/fiscal.constants';
import {
  FiscalObligationStatus,
  FiscalObligationType,
} from '../src/modules/fiscal/entities/fiscal-obligation.entity';

describe('FiscalController (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.IS_TENANT_BASED_AUTH_ENABLED = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FiscalController],
      providers: [
        {
          provide: FiscalDashboardService,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              monthlyRevenue: 2500,
              meiAnnualLimit: MEI_ANNUAL_LIMIT,
              annualRevenue: 12000,
              nextDas: {
                dueDate: '2026-06-20',
                amount: 75.9,
                daysRemaining: 9,
              },
              totalNfsEmitted: 15,
            }),
          },
        },
        {
          provide: ListObligationsService,
          useValue: {
            execute: jest.fn().mockResolvedValue([
              {
                id: 'obl-1',
                type: FiscalObligationType.DAS,
                referencePeriod: '2026-05',
                dueDate: '2026-06-20',
                amount: 75.9,
                status: FiscalObligationStatus.PENDING,
                paidAt: null,
              },
            ]),
          },
        },
        {
          provide: PayObligationService,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              obligation: {
                id: 'obl-1',
                type: FiscalObligationType.DAS,
                referencePeriod: '2026-05',
                dueDate: '2026-06-20',
                amount: 75.9,
                status: FiscalObligationStatus.PAID,
                paidAt: new Date().toISOString(),
              },
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalGuards(new AuthGuard(app.get(Reflector)));
    await app.init();

    token = jwt.sign({ sub: 'user-1' }, 'test-secret');
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/fiscal/dashboard returns dashboard metrics', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/fiscal/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        monthlyRevenue: 2500,
        meiAnnualLimit: MEI_ANNUAL_LIMIT,
        totalNfsEmitted: 15,
      }),
    );
  });

  it('GET /api/fiscal/obligations returns obligations list', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/fiscal/obligations')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].type).toBe(FiscalObligationType.DAS);
  });

  it('PATCH /api/fiscal/obligations/:id/pay marks obligation as paid', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/fiscal/obligations/obl-1/pay')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.obligation.status).toBe(FiscalObligationStatus.PAID);
  });
});
