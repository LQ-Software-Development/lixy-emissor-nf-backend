import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { PushToken } from '../entities/push-token.entity';
import { DasReminderService } from '../services/das-reminder.service';
import { FCMService } from '../services/fcm.service';
import { EmailService } from '../services/email.service';

describe('DasReminderService', () => {
  let service: DasReminderService;
  let notificationRepository: Repository<Notification>;
  let pushTokenRepository: Repository<PushToken>;
  let fcmService: FCMService;
  let emailService: EmailService;

  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPushTokenRepository = {
    find: jest.fn(),
  };

  const mockFCMService = {
    sendBulkNotifications: jest.fn(),
  };

  const mockEmailService = {
    sendDasReminderEmail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DasReminderService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: getRepositoryToken(PushToken),
          useValue: mockPushTokenRepository,
        },
        {
          provide: FCMService,
          useValue: mockFCMService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DasReminderService>(DasReminderService);
    notificationRepository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    pushTokenRepository = module.get<Repository<PushToken>>(getRepositoryToken(PushToken));
    fcmService = module.get<FCMService>(FCMService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findUpcomingDasReminders', () => {
    it('should return empty array when no DAS module available', async () => {
      const result = await service.findUpcomingDasReminders(3);

      expect(result).toEqual([]);
    });
  });

  describe('processReminders', () => {
    it('should log when no reminders to process', async () => {
      mockConfigService.get.mockReturnValue(3);

      // Spy on logger
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.processReminders();

      expect(loggerSpy).toHaveBeenCalledWith('No DAS reminders to process');
    });
  });
});
