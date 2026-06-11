import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus, NotificationType } from '../entities/notification.entity';
import { PushToken, PushPlatform } from '../entities/push-token.entity';
import { NotificationsService } from '../notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: Repository<Notification>;
  let pushTokenRepository: Repository<PushToken>;

  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPushTokenRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: getRepositoryToken(PushToken),
          useValue: mockPushTokenRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationRepository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    pushTokenRepository = module.get<Repository<PushToken>>(getRepositoryToken(PushToken));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const dto = {
        userId: 'user-123',
        title: 'Test Notification',
        body: 'Test body',
        type: NotificationType.PUSH,
        category: 'test',
      };

      const expectedNotification = {
        id: 'notif-123',
        ...dto,
        status: NotificationStatus.UNREAD,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNotificationRepository.create.mockReturnValue(expectedNotification);
      mockNotificationRepository.save.mockResolvedValue(expectedNotification);

      const result = await service.create(dto);

      expect(result).toEqual(expectedNotification);
      expect(mockNotificationRepository.create).toHaveBeenCalledWith(dto);
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(expectedNotification);
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const userId = 'user-123';
      const query = { page: 1, limit: 20 };

      const mockNotifications = [
        {
          id: 'notif-1',
          userId,
          title: 'Test',
          body: 'Test body',
          status: NotificationStatus.UNREAD,
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockNotifications, 1]),
      };

      mockNotificationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(userId, query);

      expect(result).toEqual({
        data: mockNotifications,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should filter by status', async () => {
      const userId = 'user-123';
      const query = { status: NotificationStatus.UNREAD };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockNotificationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll(userId, query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'notification.status = :status',
        { status: NotificationStatus.UNREAD },
      );
    });
  });

  describe('findOne', () => {
    it('should return a notification by id', async () => {
      const userId = 'user-123';
      const notificationId = 'notif-123';

      const expectedNotification = {
        id: notificationId,
        userId,
        title: 'Test',
        body: 'Test body',
      };

      mockNotificationRepository.findOne.mockResolvedValue(expectedNotification);

      const result = await service.findOne(notificationId, userId);

      expect(result).toEqual(expectedNotification);
      expect(mockNotificationRepository.findOne).toHaveBeenCalledWith({
        where: { id: notificationId, userId },
      });
    });

    it('should throw NotFoundException when notification not found', async () => {
      const userId = 'user-123';
      const notificationId = 'notif-123';

      mockNotificationRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(notificationId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const userId = 'user-123';
      const notificationId = 'notif-123';

      const existingNotification = {
        id: notificationId,
        userId,
        title: 'Test',
        body: 'Test body',
        status: NotificationStatus.UNREAD,
      };

      const updatedNotification = {
        ...existingNotification,
        status: NotificationStatus.READ,
      };

      mockNotificationRepository.findOne.mockResolvedValue(existingNotification);
      mockNotificationRepository.save.mockResolvedValue(updatedNotification);

      const result = await service.markAsRead(notificationId, userId);

      expect(result.status).toBe(NotificationStatus.READ);
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: NotificationStatus.READ }),
      );
    });
  });

  describe('registerPushToken', () => {
    it('should create a new push token', async () => {
      const userId = 'user-123';
      const dto = {
        token: 'fcm-token-123',
        platform: PushPlatform.ANDROID,
      };

      const expectedToken = {
        id: 'token-123',
        userId,
        ...dto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPushTokenRepository.findOne.mockResolvedValue(null);
      mockPushTokenRepository.create.mockReturnValue(expectedToken);
      mockPushTokenRepository.save.mockResolvedValue(expectedToken);

      const result = await service.registerPushToken(userId, dto);

      expect(result).toEqual(expectedToken);
      expect(mockPushTokenRepository.create).toHaveBeenCalledWith({
        userId,
        token: dto.token,
        platform: dto.platform,
      });
    });

    it('should update existing push token', async () => {
      const userId = 'user-123';
      const dto = {
        token: 'fcm-token-123',
        platform: PushPlatform.ANDROID,
      };

      const existingToken = {
        id: 'token-123',
        userId,
        token: dto.token,
        platform: PushPlatform.IOS,
        isActive: false,
      };

      const updatedToken = {
        ...existingToken,
        platform: dto.platform,
        isActive: true,
      };

      mockPushTokenRepository.findOne.mockResolvedValue(existingToken);
      mockPushTokenRepository.save.mockResolvedValue(updatedToken);

      const result = await service.registerPushToken(userId, dto);

      expect(result).toEqual(updatedToken);
      expect(mockPushTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: dto.platform,
          isActive: true,
        }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      const userId = 'user-123';

      mockNotificationRepository.count.mockResolvedValue(5);

      const result = await service.getUnreadCount(userId);

      expect(result).toBe(5);
      expect(mockNotificationRepository.count).toHaveBeenCalledWith({
        where: {
          userId,
          status: NotificationStatus.UNREAD,
        },
      });
    });
  });
});
