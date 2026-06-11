import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { Notification, NotificationStatus } from './entities/notification.entity';
import { PushToken } from './entities/push-token.entity';

export type PaginatedNotificationsResult = {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(PushToken)
    private readonly pushTokenRepository: Repository<PushToken>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async findAll(userId: string, query: QueryNotificationsDto): Promise<PaginatedNotificationsResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.deletedAt IS NULL');

    if (query.status) {
      queryBuilder.andWhere('notification.status = :status', { status: query.status });
    }

    if (query.category) {
      queryBuilder.andWhere('notification.category = :category', { category: query.category });
    }

    const [data, total] = await queryBuilder
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }

    return notification;
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.findOne(id, userId);

    notification.status = NotificationStatus.READ;
    return this.notificationRepository.save(notification);
  }

  async registerPushToken(
    userId: string,
    registerPushTokenDto: RegisterPushTokenDto,
  ): Promise<PushToken> {
    // Check if token already exists for this user
    const existingToken = await this.pushTokenRepository.findOne({
      where: {
        userId,
        token: registerPushTokenDto.token,
      },
    });

    if (existingToken) {
      // Update existing token
      existingToken.platform = registerPushTokenDto.platform;
      existingToken.isActive = true;
      return this.pushTokenRepository.save(existingToken);
    }

    // Create new token
    const pushToken = this.pushTokenRepository.create({
      userId,
      token: registerPushTokenDto.token,
      platform: registerPushTokenDto.platform,
    });

    return this.pushTokenRepository.save(pushToken);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: {
        userId,
        status: NotificationStatus.UNREAD,
      },
    });
  }
}
