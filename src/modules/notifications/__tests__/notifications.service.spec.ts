import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationCategory,
  NotificationStatus,
  NotificationType,
} from '../entities/notification.entity';
import { PushPlatform, PushToken } from '../entities/push-token.entity';
import { NotificationsService } from '../notifications.service';

const mockNotification = (): Notification => ({
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  userId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  title: 'Test',
  body: 'Body',
  type: NotificationType.SYSTEM,
  status: NotificationStatus.UNREAD,
  metadata: null,
  category: NotificationCategory.SYSTEM,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationsRepository: jest.Mocked<Repository<Notification>>;
  let pushTokensRepository: jest.Mocked<Repository<PushToken>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PushToken),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(NotificationsService);
    notificationsRepository = module.get(getRepositoryToken(Notification));
    pushTokensRepository = module.get(getRepositoryToken(PushToken));
  });

  it('creates a notification', async () => {
    const notification = mockNotification();
    notificationsRepository.create.mockReturnValue(notification);
    notificationsRepository.save.mockResolvedValue(notification);

    await expect(
      service.create({
        userId: notification.userId,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        category: notification.category,
      }),
    ).resolves.toEqual(notification);
  });

  it('lists notifications with pagination', async () => {
    const notification = mockNotification();
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[notification], 1]),
    };

    notificationsRepository.createQueryBuilder.mockReturnValue(
      queryBuilder as never,
    );

    const result = await service.findAll(notification.userId, {
      page: 1,
      limit: 10,
      status: NotificationStatus.UNREAD,
    });

    expect(result).toEqual({
      data: [notification],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('marks notification as read', async () => {
    const notification = mockNotification();
    notificationsRepository.findOne.mockResolvedValue(notification);
    notificationsRepository.save.mockResolvedValue({
      ...notification,
      status: NotificationStatus.READ,
    });

    const result = await service.markAsRead(
      notification.userId,
      notification.id,
    );

    expect(result.status).toBe(NotificationStatus.READ);
  });

  it('throws when marking unknown notification as read', async () => {
    notificationsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.markAsRead('user-id', 'missing-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('registers a new push token', async () => {
    const pushToken: PushToken = {
      id: 'token-id',
      userId: 'user-id',
      token: 'fcm-token',
      platform: PushPlatform.ANDROID,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    pushTokensRepository.findOne.mockResolvedValue(null);
    pushTokensRepository.create.mockReturnValue(pushToken);
    pushTokensRepository.save.mockResolvedValue(pushToken);

    await expect(
      service.registerPushToken('user-id', {
        token: 'fcm-token',
        platform: PushPlatform.ANDROID,
      }),
    ).resolves.toEqual(pushToken);
  });

  it('reactivates existing push token', async () => {
    const pushToken: PushToken = {
      id: 'token-id',
      userId: 'user-id',
      token: 'fcm-token',
      platform: PushPlatform.IOS,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    pushTokensRepository.findOne.mockResolvedValue(pushToken);
    pushTokensRepository.save.mockResolvedValue({
      ...pushToken,
      isActive: true,
      platform: PushPlatform.ANDROID,
    });

    const result = await service.registerPushToken('user-id', {
      token: 'fcm-token',
      platform: PushPlatform.ANDROID,
    });

    expect(result.isActive).toBe(true);
    expect(result.platform).toBe(PushPlatform.ANDROID);
  });

  it('returns active push tokens', async () => {
    const tokens: PushToken[] = [
      {
        id: 'token-id',
        userId: 'user-id',
        token: 'fcm-token',
        platform: PushPlatform.WEB,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    pushTokensRepository.find.mockResolvedValue(tokens);

    await expect(service.getActivePushTokens('user-id')).resolves.toEqual(
      tokens,
    );
  });
});
