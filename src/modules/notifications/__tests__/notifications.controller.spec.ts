import { Test, TestingModule } from '@nestjs/testing';
import {
  Notification,
  NotificationCategory,
  NotificationStatus,
  NotificationType,
} from '../entities/notification.entity';
import { PushPlatform } from '../entities/push-token.entity';
import { NotificationsController } from '../notifications.controller';
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

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;
  const userId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            findAll: jest.fn(),
            markAsRead: jest.fn(),
            registerPushToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(NotificationsController);
    service = module.get(NotificationsService);
  });

  it('lists notifications for authenticated user', async () => {
    const paginated = {
      data: [mockNotification()],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
    service.findAll.mockResolvedValue(paginated);

    await expect(controller.findAll(userId, {})).resolves.toEqual(paginated);
    expect(service.findAll).toHaveBeenCalledWith(userId, {});
  });

  it('marks notification as read', async () => {
    const notification = mockNotification();
    service.markAsRead.mockResolvedValue({
      ...notification,
      status: NotificationStatus.READ,
    });

    await expect(
      controller.markAsRead(userId, notification.id),
    ).resolves.toEqual({
      ...notification,
      status: NotificationStatus.READ,
    });
  });

  it('registers push token', async () => {
    const pushToken = {
      id: 'token-id',
      userId,
      token: 'fcm-token',
      platform: PushPlatform.ANDROID,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    service.registerPushToken.mockResolvedValue(pushToken);

    await expect(
      controller.registerPush(userId, {
        token: 'fcm-token',
        platform: PushPlatform.ANDROID,
      }),
    ).resolves.toEqual(pushToken);
  });
});
