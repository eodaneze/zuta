import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationService } from './notification.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { RegisterPushSubscriptionDto } from './dto/register-push-subscription.dto';
import { Query } from '@nestjs/common';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my inbox notifications' })
  getMyNotifications(
    @CurrentUser() user: any,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationService.getMyNotifications(user._id.toString(), query);
  }

  @Patch('me/:notificationId/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  markAsRead(
    @CurrentUser() user: any,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.markAsRead(
      user._id.toString(),
      notificationId,
    );
  }

  @Patch('me/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationService.markAllAsRead(user._id.toString());
  }

  @Post('push-subscriptions')
  @ApiOperation({ summary: 'Register browser push subscription' })
  registerPushSubscription(
    @CurrentUser() user: any,
    @Body() dto: RegisterPushSubscriptionDto,
  ) {
    return this.notificationService.savePushSubscription(
      user._id.toString(),
      dto,
    );
  }
}