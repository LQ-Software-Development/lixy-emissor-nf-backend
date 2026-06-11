import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { Notification } from './entities/notification.entity';
import { PushToken } from './entities/push-token.entity';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated notifications list' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  findAll(
    @CurrentUser('sub') userId: string,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.findAll(userId, query);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  markAsRead(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(userId, id);
  }

  @Post('register-push')
  @ApiOperation({ summary: 'Register FCM push token for the user' })
  @ApiResponse({ status: 201, description: 'Push token registered' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  registerPush(
    @CurrentUser('sub') userId: string,
    @Body() dto: RegisterPushTokenDto,
  ): Promise<PushToken> {
    return this.notificationsService.registerPushToken(userId, dto);
  }
}
