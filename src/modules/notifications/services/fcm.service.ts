import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin';
import { getMessaging, type MulticastMessage } from 'firebase-admin/messaging';
import { PushToken } from '../entities/push-token.entity';

export type FcmPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService) {
    this.initialize();
  }

  private initialize(): void {
    if (this.initialized || getApps().length > 0) {
      this.initialized = true;
      return;
    }

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('Firebase credentials not configured; push disabled');
      return;
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    this.initialized = true;
  }

  isConfigured(): boolean {
    return this.initialized && getApps().length > 0;
  }

  async sendToTokens(
    tokens: PushToken[],
    payload: FcmPayload,
  ): Promise<{ successCount: number; failureCount: number }> {
    const activeTokens = tokens.filter((entry) => entry.isActive);

    if (activeTokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    if (!this.isConfigured()) {
      this.logger.warn('FCM not configured; skipping push delivery');
      return { successCount: 0, failureCount: activeTokens.length };
    }

    const message: MulticastMessage = {
      tokens: activeTokens.map((entry) => entry.token),
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
    };

    const response = await getMessaging().sendEachForMulticast(message);

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  }
}
