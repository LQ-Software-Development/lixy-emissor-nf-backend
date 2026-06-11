import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from '../notifications.controller';
import { NotificationsService } from '../notifications.service';
import { NotificationStatus } from '../entities/notification.entity';
import { QueryNotificationsDto } from '../dto/query-notifications.dto';
import { RegisterPushTokenDto } from '../dto/register-push-token.dto';
import { PushPlatform } from '../entities/push-token.entity';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotificationsService = {
    findAll: jest.fn(),
    markAsRead: jest.fn(),
    registerPushToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const userId = 'user-123';
      const query: QueryNotificationsDto = { page: 1, limit: 20 };
      const expectedResult = {
        data: [
          {
            id: 'notif-1',
            userId,
            title: 'Test',
            body: 'Test body',
            status: NotificationStatus.UNREAD,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockNotificationsService.findAll.mockResolvedValue(expectedResult);

      const req = { user: { id: userId } };
      const result = await controller.findAll(req, query);

      expect(result).toEqual(expectedResult);
      expect(mockNotificationsService.findAll).toHaveBeenCalledWith(userId, query);
    });

    it('should use default userId when user not in request', async () => {
      const query: QueryNotificationsDto = {};
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockNotificationsService.findAll.mockResolvedValue(expectedResult);

      const req = {};
      const result = await controller.findAll(req, query);

      expect(result).toEqual(expectedResult);
      expect(mockNotificationsService.findAll).toHaveBeenCalledWith(
        '00000000-0000-0000-0000-000000000000',
        query,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const userId = 'user-123';
      const notificationId = 'notif-123';
      const expectedResult = {
        id: notificationId,
        userId,
        title: 'Test',
        body: 'Test body',
        status: NotificationStatus.READ,
      };

      mockNotificationsService.markAsRead.mockResolvedValue(expectedResult);

      const req = { user: { id: userId } };
      const result = await controller.markAsRead(req, notificationId);

      expect(result).toEqual(expectedResult);
      expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith(notificationId, userId);
    });
  });

  describe('registerPushToken', () => {
    it('should register push token', async () => {
      const userId = 'user-123';
      const dto: RegisterPushTokenDto = {
        token: 'fcm-token-123',
        platform: PushPlatform.ANDROID,
      };
      const expectedResult = {
        id: 'token-123',
        userId,
        token: dto.token,
        platform: dto.platform,
        isActive: true,
      };

      mockNotificationsService.registerPushToken.mockResolvedValue(expectedResult);

      const req = { user: { id: userId } };
      const result = await controller.registerPushToken(req, dto);

      expect(result).toEqual(expectedResult);
      expect(mockNotificationsService.registerPushToken).toHaveBeenCalledWith(userId, dto);
    });
  });
});
