import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushToken } from '../entities/push-token.entity';

export type FcmPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private readonly pushEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.pushEnabled =
      this.configService.get<string>('PUSH_NOTIFICATIONS_ENABLED', 'false') ===
      'true';
  }

  isConfigured(): boolean {
    return this.pushEnabled;
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
      this.logger.warn(
        `Push provider not configured; skipping delivery for ${activeTokens.length} token(s)`,
      );
      return { successCount: 0, failureCount: activeTokens.length };
    }

    this.logger.log(
      `Push delivery stub: title="${payload.title}" tokens=${activeTokens.length}`,
    );

    return { successCount: activeTokens.length, failureCount: 0 };
  }
}
