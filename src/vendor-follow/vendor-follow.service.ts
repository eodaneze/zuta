import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  VendorFollow,
  VendorFollowDocument,
} from './schemas/vendor-follow.schema';
import {
  VendorProfile,
  VendorProfileDocument,
} from '../vendor/schemas/vendor-profile.schema';
import { VendorStatus } from '../vendor/enums/vendor-status.enum';
import { NotificationService } from 'src/notification/notification.service';
import { UsersService } from 'src/users/users.service';
import { NotificationType } from 'src/notification/enums/notification-type.enum';

@Injectable()
export class VendorFollowService {
  constructor(
    @InjectModel(VendorFollow.name)
    private readonly vendorFollowModel: Model<VendorFollowDocument>,
    @InjectModel(VendorProfile.name)
    private readonly vendorProfileModel: Model<VendorProfileDocument>,
     private readonly notificationService: NotificationService,
     private readonly userService: UsersService,
  ) {}

  async followVendor(userId: string, vendorProfileId: string) {
    const vendorProfile = await this.vendorProfileModel.findOne({
      _id: vendorProfileId,
      onboardingStatus: VendorStatus.APPROVED,
    });

 
    const user = await this.userService.findById(userId);
    const userName = user.fullName;

   


    if (!vendorProfile) {
      throw new NotFoundException('Vendor not found');
    }

    const vendorUserId = vendorProfile.userId.toString();

    if (userId === vendorUserId) {
      throw new BadRequestException('You cannot follow your own vendor account');
    }

    const existingFollow = await this.vendorFollowModel.findOne({
      followerId: new Types.ObjectId(userId),
      vendorId: new Types.ObjectId(vendorUserId),
    });

    if (existingFollow) {
      throw new BadRequestException('You already follow this vendor');
    }

    await this.vendorFollowModel.create({
      followerId: new Types.ObjectId(userId),
      vendorId: new Types.ObjectId(vendorUserId),
      vendorProfileId: vendorProfile._id,
    });

    const followersCount = await this.vendorFollowModel.countDocuments({
      vendorId: new Types.ObjectId(vendorUserId),
    });

    
    await this.notificationService.createNotification({
        userId: vendorProfile.userId.toString(),
        title: 'New Follower',
        message: `A user with the name ${userName} started following your store`,
        type: NotificationType.FOLLOW_VENDOR,
        metadata: {
           followerId: userId.toString(),
           followerName: userName
        }
    })

    return {
      message: 'Vendor followed successfully',
      data: {
        vendorProfileId: vendorProfile._id,
        vendorId: vendorUserId,
        followersCount,
        isFollowing: true,
      },
    };
  }

  async unfollowVendor(userId: string, vendorProfileId: string) {
    const vendorProfile = await this.vendorProfileModel.findById(vendorProfileId);

    if (!vendorProfile) {
      throw new NotFoundException('Vendor not found');
    }

    const vendorUserId = vendorProfile.userId.toString();

    const deletedFollow = await this.vendorFollowModel.findOneAndDelete({
      followerId: new Types.ObjectId(userId),
      vendorId: new Types.ObjectId(vendorUserId),
    });

    if (!deletedFollow) {
      throw new BadRequestException('You are not following this vendor');
    }

    const followersCount = await this.vendorFollowModel.countDocuments({
      vendorId: new Types.ObjectId(vendorUserId),
    });

    return {
      message: 'Vendor unfollowed successfully',
      data: {
        vendorProfileId: vendorProfile._id,
        vendorId: vendorUserId,
        followersCount,
        isFollowing: false,
      },
    };
  }

  async getFollowersCountByVendorUserId(vendorUserId: string) {
    return this.vendorFollowModel.countDocuments({
      vendorId: new Types.ObjectId(vendorUserId),
    });
  }

  async getFollowersCountByVendorProfileId(vendorProfileId: string) {
    return this.vendorFollowModel.countDocuments({
      vendorProfileId: new Types.ObjectId(vendorProfileId),
    });
  }

  async isFollowingVendor(userId: string, vendorUserId: string) {
    const existingFollow = await this.vendorFollowModel.findOne({
      followerId: new Types.ObjectId(userId),
      vendorId: new Types.ObjectId(vendorUserId),
    });

    return !!existingFollow;
  }
}