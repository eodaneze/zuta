import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {  Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { VendorService } from '../vendor/vendor.service';
import { VendorStatus } from '../vendor/enums/vendor-status.enum';
import { ProductService } from 'src/product/product.service';
import { ProductStatus } from 'src/product/enums/product-status.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly vendorService: VendorService,
    private readonly productService: ProductService,
  ) {}

  async getUsers(params: {
    search?: string;
    role?: UserRole;
    page?: number;
    limit?: number;
  }) {
    const { search, role } = params;
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

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

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.userModel.countDocuments(query),
    ]);

    return {
      message: 'Users fetched successfully',
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStores(params: {
    status?: VendorStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return this.vendorService.adminGetStores(params);
  }

  async getKycs(params: {
    status?: VendorStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return this.vendorService.adminGetKycs(params);
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

   async getProducts(params: {
    search?: string;
    category?: string;
    status?: ProductStatus;
    page?: number;
    limit?: number;
  }) {
    return this.productService.adminGetProducts(params);
  }

  async approveProduct(productId: string) {
    return this.productService.adminApproveProduct(productId);
  }

  async rejectProduct(productId: string, reason: string) {
    return this.productService.adminRejectProduct(productId, reason);
  }
}