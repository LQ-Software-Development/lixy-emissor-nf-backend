import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FiscalObligation,
  ObligationStatus,
  ObligationType,
} from '../../fiscal/entities/fiscal-obligation.entity';
import {
  NotificationCategory,
  NotificationStatus,
  NotificationType,
} from '../entities/notification.entity';
import { PushPlatform } from '../entities/push-token.entity';
import { User } from '../../auth/entities/user.entity';
import { NotificationsService } from '../notifications.service';
import { DasReminderService } from '../services/das-reminder.service';
import { EmailService } from '../services/email.service';
import { FcmService } from '../services/fcm.service';

const mockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  cnpj: '11444777000161',
  email: 'user@test.com',
  razaoSocial: 'MEI Teste LTDA',
  passwordHash: 'hash',
  refreshTokenHash: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

const mockObligation = (
  overrides: Partial<FiscalObligation> = {},
): FiscalObligation => ({
  id: 'obligation-1',
  companyId: 'user-1',
  type: ObligationType.DAS,
  referencePeriod: '2026-05',
  dueDate: new Date('2026-06-14'),
  amount: '75.90',
  status: ObligationStatus.PENDING,
  paidAt: null,
  barcode: '85890000000759012345678901234567890123456789',
  createdAt: new Date('2026-05-01'),
  updatedAt: new Date('2026-05-01'),
  ...overrides,
});

describe('DasReminderService', () => {
  let service: DasReminderService;
  let obligationRepository: jest.Mocked<Repository<FiscalObligation>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let fcmService: jest.Mocked<FcmService>;
  let emailService: jest.Mocked<EmailService>;
  let obligationQueryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(async () => {
    obligationQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DasReminderService,
        {
          provide: getRepositoryToken(FiscalObligation),
          useValue: {
            createQueryBuilder: jest
              .fn()
              .mockReturnValue(obligationQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: NotificationsService,
          useValue: {
            create: jest.fn(),
            getActivePushTokens: jest.fn(),
          },
        },
        {
          provide: FcmService,
          useValue: { sendToTokens: jest.fn() },
        },
        {
          provide: EmailService,
          useValue: { send: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(DasReminderService);
    obligationRepository = module.get(getRepositoryToken(FiscalObligation));
    userRepository = module.get(getRepositoryToken(User));
    notificationsService = module.get(NotificationsService);
    fcmService = module.get(FcmService);
    emailService = module.get(EmailService);
  });

  it('calculates target due date 3 days ahead', () => {
    const referenceDate = new Date('2026-06-11T12:00:00.000Z');
    expect(service.getTargetDueDate(referenceDate)).toBe('2026-06-14');
  });

  it('creates notifications and sends push with barcode', async () => {
    const userId = 'user-1';
    const obligation = mockObligation({ companyId: userId });

    obligationQueryBuilder.getMany.mockResolvedValue([obligation]);
    userRepository.findOne.mockResolvedValue(
      mockUser({ id: userId, email: 'user@test.com' }),
    );
    notificationsService.create.mockResolvedValue({
      id: 'notification-1',
      userId,
      title: 'Lembrete',
      body: 'Body',
      type: NotificationType.DAS_REMINDER,
      status: NotificationStatus.UNREAD,
      metadata: { barcode: obligation.barcode },
      category: NotificationCategory.DAS,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    notificationsService.getActivePushTokens.mockResolvedValue([
      {
        id: 'token-1',
        userId,
        token: 'fcm-token',
        platform: PushPlatform.ANDROID,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    fcmService.sendToTokens.mockResolvedValue({
      successCount: 1,
      failureCount: 0,
    });

    const result = await service.processReminders(new Date('2026-06-11'));

    expect(result).toEqual({
      processed: 1,
      notificationsCreated: 1,
      pushSent: 1,
      emailsSent: 0,
    });

    expect(obligationRepository.createQueryBuilder).toHaveBeenCalledWith(
      'obligation',
    );
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          barcode: obligation.barcode,
        }),
      }),
    );

    expect(fcmService.sendToTokens).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        data: expect.objectContaining({
          barcode: obligation.barcode,
        }),
      }),
    );
  });

  it('falls back to email when push fails', async () => {
    const userId = 'user-1';
    const obligation = mockObligation({ companyId: userId });

    obligationQueryBuilder.getMany.mockResolvedValue([obligation]);
    userRepository.findOne.mockResolvedValue(
      mockUser({ id: userId, email: 'user@test.com' }),
    );
    notificationsService.create.mockResolvedValue({
      id: 'notification-1',
      userId,
      title: 'Lembrete',
      body: 'Body',
      type: NotificationType.DAS_REMINDER,
      status: NotificationStatus.UNREAD,
      metadata: null,
      category: NotificationCategory.DAS,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    notificationsService.getActivePushTokens.mockResolvedValue([]);
    fcmService.sendToTokens.mockResolvedValue({
      successCount: 0,
      failureCount: 0,
    });
    emailService.send.mockResolvedValue(true);

    const result = await service.processReminders(new Date('2026-06-11'));

    expect(result.emailsSent).toBe(1);
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@test.com',
        html: expect.stringContaining(obligation.barcode!),
      }),
    );
  });
});
