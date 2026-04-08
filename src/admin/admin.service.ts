import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {  Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { VendorService } from '../vendor/vendor.service';
import { VendorStatus } from '../vendor/enums/vendor-status.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly vendorService: VendorService,
  ) {}

  async getUsers(search?: string, role?: UserRole) {
    const query: Record<string, any> = {};

    if (role) {
      query.roles = { $in: [role] };
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await this.userModel
      .find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    return {
      message: 'Users fetched successfully',
      data: users,
    };
  }

  async getStores(status?: VendorStatus, search?: string) {
    return this.vendorService.adminGetStores(status, search);
  }

  async getKycs(status?: VendorStatus, search?: string) {
    return this.vendorService.adminGetKycs(status, search);
  }

  async approveStore(vendorProfileId: string) {
    return this.vendorService.adminApproveStore(vendorProfileId);
  }

  async rejectStore(vendorProfileId: string, reason: string) {
    return this.vendorService.adminRejectStore(vendorProfileId, reason);
  }

  async approveKyc(vendorKycId: string) {
    return this.vendorService.adminApproveKyc(vendorKycId);
  }

  async rejectKyc(vendorKycId: string, reason: string) {
    return this.vendorService.adminRejectKyc(vendorKycId, reason);
  }
}