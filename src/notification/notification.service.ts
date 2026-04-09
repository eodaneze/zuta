import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notifcation.schema';
import {
  PushSubscriptionDocument,
  PushSubscriptionEntity,
} from './schemas/push-subscription.schema';
import { NotificationType } from './enums/notification-type.enum';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(PushSubscriptionEntity.name)
    private readonly pushSubscriptionModel: Model<PushSubscriptionDocument>,
  ) {}

  async createNotification(params: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: Record<string, any>;
  }) {
    const notification = await this.notificationModel.create({
      userId: new Types.ObjectId(params.userId),
      title: params.title,
      message: params.message,
      type: params.type,
      metadata: params.metadata || null,
      isRead: false,
    });

    return notification;
  }

  async getMyNotifications(userId: string, query: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter: any = {
      userId: new Types.ObjectId(userId),
    };

    if (query.unreadOnly) {
      filter.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.notificationModel.countDocuments(filter),
      this.notificationModel.countDocuments({
        userId: new Types.ObjectId(userId),
        isRead: false,
      }),
    ]);

    return {
      message: 'Notifications fetched successfully',
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationModel.findOneAndUpdate(
      {
        _id: notificationId,
        userId: new Types.ObjectId(userId),
      },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return {
      message: 'Notification marked as read',
      data: notification,
    };
  }

  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true },
    );

    return {
      message: 'All notifications marked as read',
    };
  }

  async savePushSubscription(userId: string, dto: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }) {
    const subscription = await this.pushSubscriptionModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        endpoint: dto.endpoint,
      },
      {
        userId: new Types.ObjectId(userId),
        endpoint: dto.endpoint,
        keys: dto.keys,
        isActive: true,
      },
      { upsert: true, new: true },
    );

    return {
      message: 'Push subscription registered successfully',
      data: subscription,
    };
  }

  async deactivatePushSubscription(userId: string, endpoint: string) {
    await this.pushSubscriptionModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        endpoint,
      },
      { isActive: false },
    );

    return {
      message: 'Push subscription removed successfully',
    };
  }

  async sendBrowserPushToUser(_userId: string, _payload: {
    title: string;
    body: string;
    url?: string;
  }) {
    // next step:
    // integrate web-push or Firebase Cloud Messaging here
    // and send to all active subscriptions for the user
    return;
  }
}