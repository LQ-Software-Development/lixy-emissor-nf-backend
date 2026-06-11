import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FCMService } from '../services/fcm.service';

describe('FCMService', () => {
  let service: FCMService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FCMService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FCMService>(FCMService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('sendPushNotification', () => {
    it('should return false when Firebase is not initialized', async () => {
      // Firebase credentials not set
      mockConfigService.get.mockReturnValue(undefined);

      // Re-initialize service
      const newService = new FCMService(configService);

      const result = await newService.sendPushNotification(
        'token',
        'title',
        'body',
      );

      expect(result).toBe(false);
    });
  });

  describe('sendBulkNotifications', () => {
    it('should return failure count when Firebase is not initialized', async () => {
      // Firebase credentials not set
      mockConfigService.get.mockReturnValue(undefined);

      // Re-initialize service
      const newService = new FCMService(configService);

      const result = await newService.sendBulkNotifications(
        ['token1', 'token2'],
        'title',
        'body',
      );

      expect(result).toEqual({ success: 0, failure: 2 });
    });
  });
});
