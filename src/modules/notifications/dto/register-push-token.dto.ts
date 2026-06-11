import { IsEnum, IsString } from 'class-validator';
import { PushPlatform } from '../entities/push-token.entity';

export class RegisterPushTokenDto {
  @IsString()
  token!: string;

  @IsEnum(PushPlatform)
  platform!: PushPlatform;
}
