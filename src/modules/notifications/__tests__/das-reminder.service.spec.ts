import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FiscalObligationRef,
  FiscalObligationStatus,
  FiscalObligationType,
} from '../entities/fiscal-obligation-ref.entity';
import {
  NotificationCategory,
  NotificationStatus,
  NotificationType,
} from '../entities/notification.entity';
import { PushPlatform } from '../entities/push-token.entity';
import { UserRef } from '../entities/user-ref.entity';
import { NotificationsService } from '../notifications.service';
import { DasReminderService } from '../services/das-reminder.service';
import { EmailService } from '../services/email.service';
import { FcmService } from '../services/fcm.service';

describe('DasReminderService', () => {
  let service: DasReminderService;
  let obligationRepository: jest.Mocked<Repository<FiscalObligationRef>>;
  let userRepository: jest.Mocked<Repository<UserRef>>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let fcmService: jest.Mocked<FcmService>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DasReminderService,
        {
          provide: getRepositoryToken(FiscalObligationRef),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(UserRef),
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
    obligationRepository = module.get(getRepositoryToken(FiscalObligationRef));
    userRepository = module.get(getRepositoryToken(UserRef));
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
    const obligation: FiscalObligationRef = {
      id: 'obligation-1',
      companyId: userId,
      type: FiscalObligationType.DAS,
      referencePeriod: '2026-05',
      dueDate: '2026-06-14',
      amount: '75.90',
      status: FiscalObligationStatus.PENDING,
      barcode: '85890000000759012345678901234567890123456789',
    };

    obligationRepository.find.mockResolvedValue([obligation]);
    userRepository.findOne.mockResolvedValue({
      id: userId,
      email: 'user@test.com',
    });
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
    const obligation: FiscalObligationRef = {
      id: 'obligation-1',
      companyId: userId,
      type: FiscalObligationType.DAS,
      referencePeriod: '2026-05',
      dueDate: '2026-06-14',
      amount: '75.90',
      status: FiscalObligationStatus.PENDING,
      barcode: '85890000000759012345678901234567890123456789',
    };

    obligationRepository.find.mockResolvedValue([obligation]);
    userRepository.findOne.mockResolvedValue({
      id: userId,
      email: 'user@test.com',
    });
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
