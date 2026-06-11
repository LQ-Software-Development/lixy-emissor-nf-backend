import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getApps, initializeApp } from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';
import { PushPlatform, PushToken } from '../entities/push-token.entity';
import { FcmService } from '../services/fcm.service';

jest.mock('firebase-admin', () => ({
  getApps: jest.fn(() => []),
  initializeApp: jest.fn(),
  cert: jest.fn((value) => value),
}));

jest.mock('firebase-admin/messaging', () => ({
  getMessaging: jest.fn(),
}));

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

  beforeEach(() => {
    jest.clearAllMocks();
    (getApps as jest.Mock).mockReturnValue([]);
  });

  it('reports not configured without credentials', async () => {
    service = await createService({});
    expect(service.isConfigured()).toBe(false);
  });

  it('initializes when credentials are present', async () => {
    (getApps as jest.Mock).mockReturnValueOnce([]).mockReturnValue([{}]);

    service = await createService({
      FIREBASE_PROJECT_ID: 'project',
      FIREBASE_CLIENT_EMAIL: 'firebase@test.com',
      FIREBASE_PRIVATE_KEY: 'private-key',
    });

    expect(initializeApp).toHaveBeenCalled();
    expect(service.isConfigured()).toBe(true);
  });

  it('returns zero counts when no active tokens', async () => {
    service = await createService({});

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

  it('sends multicast when configured', async () => {
    const sendEachForMulticast = jest.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 0,
    });

    (getMessaging as jest.Mock).mockReturnValue({
      sendEachForMulticast,
    });
    (getApps as jest.Mock).mockReturnValue([{}]);

    service = await createService({
      FIREBASE_PROJECT_ID: 'project',
      FIREBASE_CLIENT_EMAIL: 'firebase@test.com',
      FIREBASE_PRIVATE_KEY: 'private-key',
    });

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

    expect(sendEachForMulticast).toHaveBeenCalledWith(
      expect.objectContaining({
        tokens: ['active-token'],
        data: { barcode: '123' },
      }),
    );
  });
});
