import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, cert, App } from 'firebase-admin/app';
import { getMessaging, Message, MulticastMessage } from 'firebase-admin/messaging';

@Injectable()
export class FCMService {
  private readonly logger = new Logger(FCMService.name);
  private app: App | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      const credentialsJson = this.configService.get<string>('FIREBASE_CREDENTIALS');

      if (!credentialsJson) {
        this.logger.warn('FIREBASE_CREDENTIALS not set - Firebase disabled');
        return;
      }

      const credentials = JSON.parse(credentialsJson);

      this.app = initializeApp({
        credential: cert(credentials),
      });

      this.logger.log('Firebase initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase', error);
    }
  }

  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    metadata?: Record<string, any>,
  ): Promise<boolean> {
    if (!this.app) {
      this.logger.warn('Firebase not initialized - skipping push notification');
      return false;
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const message: Message = {
          token,
          notification: {
            title,
            body,
          },
          data: metadata ? this.convertMetadata(metadata) : undefined,
          android: {
            priority: 'high',
            notification: {
              channelId: 'das_reminders',
              priority: 'high',
            },
          },
          apns: {
            payload: {
              aps: {
                contentAvailable: true,
              },
            },
          },
        };

        await getMessaging().send(message);
        this.logger.log(`Push notification sent to token: ${token.substring(0, 20)}...`);
        return true;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Push notification attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);

        if (attempt < maxRetries) {
          await this.sleep(1000 * attempt);
        }
      }
    }

    this.logger.error(`Failed to send push notification after ${maxRetries} attempts`, lastError);
    return false;
  }

  async sendBulkNotifications(
    tokens: string[],
    title: string,
    body: string,
    metadata?: Record<string, any>,
  ): Promise<{ success: number; failure: number }> {
    if (!this.app) {
      this.logger.warn('Firebase not initialized - skipping bulk notifications');
      return { success: 0, failure: tokens.length };
    }

    let success = 0;
    let failure = 0;

    const message: MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
      },
      data: metadata ? this.convertMetadata(metadata) : undefined,
      android: {
        priority: 'high',
        notification: {
          channelId: 'das_reminders',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
          },
        },
      },
    };

    try {
      const response = await getMessaging().sendEachForMulticast(message);
      success = response.successCount;
      failure = response.failureCount;

      if (failure > 0) {
        this.logger.warn(`Bulk send: ${success} succeeded, ${failure} failed`);
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            this.logger.warn(`Token ${idx} failed: ${resp.error?.message}`);
          }
        });
      }
    } catch (error) {
      this.logger.error('Bulk send failed completely', error);
      failure = tokens.length;
    }

    return { success, failure };
  }

  private convertMetadata(metadata: Record<string, any>): Record<string, string> {
    const converted: Record<string, string> = {};
    for (const [key, value] of Object.entries(metadata)) {
      converted[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return converted;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
