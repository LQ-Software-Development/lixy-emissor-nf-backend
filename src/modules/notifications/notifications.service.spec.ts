import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const notificationsRepository: jest.Mocked<
    Pick<Repository<Notification>, 'find' | 'findOne' | 'save'>
  > = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const baseNotification: Notification = {
    id: 'notif-1',
    userId: 'user-1',
    type: NotificationType.SYSTEM,
    title: 'Bem-vindo',
    message: 'Conta criada com sucesso',
    read: false,
    metadata: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: notificationsRepository,
        },
      ],
    }).compile();

    service = module.get(NotificationsService);
    jest.clearAllMocks();
  });

  it('lists notifications by user', async () => {
    notificationsRepository.find.mockResolvedValue([baseNotification]);

    await expect(service.findAllByUser('user-1')).resolves.toEqual([
      baseNotification,
    ]);
    expect(notificationsRepository.find).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      order: { createdAt: 'DESC' },
    });
  });

  it('marks notification as read', async () => {
    notificationsRepository.findOne.mockResolvedValue(baseNotification);
    notificationsRepository.save.mockResolvedValue({
      ...baseNotification,
      read: true,
    });

    const result = await service.markAsRead('notif-1', 'user-1');

    expect(result.read).toBe(true);
    expect(notificationsRepository.save).toHaveBeenCalled();
  });

  it('throws when notification is not found', async () => {
    notificationsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.markAsRead('missing', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
