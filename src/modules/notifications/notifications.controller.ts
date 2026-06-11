import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for authenticated user' })
  findAll(@Req() req: any, @Query() query: QueryNotificationsDto) {
    // TODO: Extract userId from JWT token in auth guard
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    return this.notificationsService.findAll(userId, query);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    return this.notificationsService.markAsRead(id, userId);
  }

  @Post('register-push')
  @ApiOperation({ summary: 'Register FCM push token' })
  registerPushToken(
    @Req() req: any,
    @Body() registerPushTokenDto: RegisterPushTokenDto,
  ) {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    return this.notificationsService.registerPushToken(userId, registerPushTokenDto);
  }
}
