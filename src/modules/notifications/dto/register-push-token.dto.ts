import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PushPlatform } from '../entities/push-token.entity';

export class RegisterPushTokenDto {
  @ApiProperty({ description: 'FCM device token', maxLength: 512 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token!: string;

  @ApiProperty({ enum: PushPlatform })
  @IsEnum(PushPlatform)
  platform!: PushPlatform;
}
