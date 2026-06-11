import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import {
  NotificationCategory,
  NotificationStatus,
  NotificationType,
} from '../src/modules/notifications/entities/notification.entity';
import { PushPlatform } from '../src/modules/notifications/entities/push-token.entity';
import { NotificationsController } from '../src/modules/notifications/notifications.controller';
import { NotificationsService } from '../src/modules/notifications/notifications.service';

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  const userId = 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  const jwtSecret = 'test-secret';

  const notificationsServiceMock = {
    findAll: jest.fn(),
    markAsRead: jest.fn(),
    registerPushToken: jest.fn(),
  };

  const signAccessToken = (): Promise<string> =>
    jwtService.signAsync({
      sub: userId,
      cnpj: '12345678000190',
      type: 'access',
    });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ JWT_SECRET: jwtSecret })],
        }),
        JwtModule.register({ secret: jwtSecret }),
      ],
      controllers: [NotificationsController],
      providers: [
        JwtAuthGuard,
        {
          provide: NotificationsService,
          useValue: notificationsServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get(JwtService);
    app.setGlobalPrefix('api');
    app.useGlobalGuards(app.get(JwtAuthGuard));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/notifications returns paginated list', async () => {
    const payload = {
      data: [
        {
          id: 'notification-id',
          userId,
          title: 'Test',
          body: 'Body',
          type: NotificationType.SYSTEM,
          status: NotificationStatus.UNREAD,
          metadata: null,
          category: NotificationCategory.SYSTEM,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    notificationsServiceMock.findAll.mockResolvedValue(payload);
    const token = await signAccessToken();

    await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(payload);
  });

  it('PATCH /api/notifications/:id/read marks notification as read', async () => {
    const notificationId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const notification = {
      id: notificationId,
      userId,
      title: 'Test',
      body: 'Body',
      type: NotificationType.SYSTEM,
      status: NotificationStatus.READ,
      metadata: null,
      category: NotificationCategory.SYSTEM,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    notificationsServiceMock.markAsRead.mockResolvedValue(notification);
    const token = await signAccessToken();

    await request(app.getHttpServer())
      .patch(`/api/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(notification);
  });

  it('POST /api/notifications/register-push registers token', async () => {
    const pushToken = {
      id: 'token-id',
      userId,
      token: 'fcm-token',
      platform: PushPlatform.ANDROID,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    notificationsServiceMock.registerPushToken.mockResolvedValue(pushToken);
    const token = await signAccessToken();

    await request(app.getHttpServer())
      .post('/api/notifications/register-push')
      .set('Authorization', `Bearer ${token}`)
      .send({
        token: 'fcm-token',
        platform: PushPlatform.ANDROID,
      })
      .expect(201)
      .expect(pushToken);
  });

  it('rejects requests without Authorization header', async () => {
    await request(app.getHttpServer()).get('/api/notifications').expect(401);
  });
});
