import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PushPlatform, PushToken } from '../entities/push-token.entity';
import { FcmService } from '../services/fcm.service';

describe('FcmService', () => {
  let service: FcmService;

  const createService = async (config: Record<string, string | undefined>) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FcmService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(
              (key: string, defaultValue?: string) =>
                config[key] ?? defaultValue,
            ),
          },
        },
      ],
    }).compile();

    return module.get(FcmService);
  };

  it('reports not configured when push is disabled', async () => {
    service = await createService({});
    expect(service.isConfigured()).toBe(false);
  });

  it('reports configured when push notifications are enabled', async () => {
    service = await createService({ PUSH_NOTIFICATIONS_ENABLED: 'true' });
    expect(service.isConfigured()).toBe(true);
  });

  it('returns zero counts when no active tokens', async () => {
    service = await createService({ PUSH_NOTIFICATIONS_ENABLED: 'true' });

    const tokens: PushToken[] = [
      {
        id: '1',
        userId: 'user',
        token: 'inactive',
        platform: PushPlatform.ANDROID,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await expect(
      service.sendToTokens(tokens, { title: 'T', body: 'B' }),
    ).resolves.toEqual({ successCount: 0, failureCount: 0 });
  });

  it('returns failure count when push provider is not configured', async () => {
    service = await createService({});

    const tokens: PushToken[] = [
      {
        id: '1',
        userId: 'user',
        token: 'active-token',
        platform: PushPlatform.ANDROID,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await expect(
      service.sendToTokens(tokens, { title: 'Title', body: 'Body' }),
    ).resolves.toEqual({ successCount: 0, failureCount: 1 });
  });

  it('acknowledges delivery when push is enabled', async () => {
    service = await createService({ PUSH_NOTIFICATIONS_ENABLED: 'true' });

    const tokens: PushToken[] = [
      {
        id: '1',
        userId: 'user',
        token: 'active-token',
        platform: PushPlatform.ANDROID,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await expect(
      service.sendToTokens(tokens, {
        title: 'Title',
        body: 'Body',
        data: { barcode: '123' },
      }),
    ).resolves.toEqual({ successCount: 1, failureCount: 0 });
  });
});
