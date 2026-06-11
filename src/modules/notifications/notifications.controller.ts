import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { Notification } from './entities/notification.entity';
import { PushToken } from './entities/push-token.entity';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-User-ID',
  description: 'Authenticated user UUID',
  required: true,
})
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private resolveUserId(userIdHeader?: string): string {
    if (!userIdHeader) {
      throw new UnauthorizedException('X-User-ID header is required');
    }

    return userIdHeader;
  }

  @Get()
  @ApiOperation({ summary: 'List notifications with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated notifications list' })
  @ApiResponse({ status: 401, description: 'Missing X-User-ID header' })
  findAll(
    @Headers('x-user-id') userIdHeader: string,
    @Query() query: QueryNotificationsDto,
  ) {
    const userId = this.resolveUserId(userIdHeader);
    return this.notificationsService.findAll(userId, query);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Missing X-User-ID header' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  markAsRead(
    @Headers('x-user-id') userIdHeader: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Notification> {
    const userId = this.resolveUserId(userIdHeader);
    return this.notificationsService.markAsRead(userId, id);
  }

  @Post('register-push')
  @ApiOperation({ summary: 'Register FCM push token for the user' })
  @ApiResponse({ status: 201, description: 'Push token registered' })
  @ApiResponse({ status: 401, description: 'Missing X-User-ID header' })
  registerPush(
    @Headers('x-user-id') userIdHeader: string,
    @Body() dto: RegisterPushTokenDto,
  ): Promise<PushToken> {
    const userId = this.resolveUserId(userIdHeader);
    return this.notificationsService.registerPushToken(userId, dto);
  }
}
