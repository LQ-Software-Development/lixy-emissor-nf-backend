import {
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiHeader({ name: 'X-User-ID', required: true })
  @ApiOkResponse({ description: 'Lista notificações do usuário' })
  listByUser(@Headers('x-user-id') userId: string): Promise<Notification[]> {
    return this.notificationsService.findAllByUser(userId);
  }

  @Patch(':id/read')
  @ApiHeader({ name: 'X-User-ID', required: true })
  @ApiOkResponse({ description: 'Marca notificação como lida' })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-user-id') userId: string,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(id, userId);
  }
}
