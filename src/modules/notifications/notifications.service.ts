import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import {
  Notification,
  NotificationStatus,
} from './entities/notification.entity';
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
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(PushToken)
    private readonly pushTokensRepository: Repository<PushToken>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      userId: dto.userId,
      title: dto.title,
      body: dto.body,
      type: dto.type,
      category: dto.category,
      metadata: dto.metadata ?? null,
      status: NotificationStatus.UNREAD,
    });

    return this.notificationsRepository.save(notification);
  }

  async findAll(
    userId: string,
    query: QueryNotificationsDto,
  ): Promise<PaginatedNotificationsResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificationsRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.deletedAt IS NULL');

    if (query.status) {
      queryBuilder.andWhere('notification.status = :status', {
        status: query.status,
      });
    }

    if (query.type) {
      queryBuilder.andWhere('notification.type = :type', { type: query.type });
    }

    if (query.category) {
      queryBuilder.andWhere('notification.category = :category', {
        category: query.category,
      });
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

  async markAsRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }

    notification.status = NotificationStatus.READ;
    return this.notificationsRepository.save(notification);
  }

  async registerPushToken(
    userId: string,
    dto: RegisterPushTokenDto,
  ): Promise<PushToken> {
    const existing = await this.pushTokensRepository.findOne({
      where: { userId, token: dto.token },
    });

    if (existing) {
      existing.platform = dto.platform;
      existing.isActive = true;
      return this.pushTokensRepository.save(existing);
    }

    const pushToken = this.pushTokensRepository.create({
      userId,
      token: dto.token,
      platform: dto.platform,
      isActive: true,
    });

    return this.pushTokensRepository.save(pushToken);
  }

  async getActivePushTokens(userId: string): Promise<PushToken[]> {
    return this.pushTokensRepository.find({
      where: { userId, isActive: true },
    });
  }
}
