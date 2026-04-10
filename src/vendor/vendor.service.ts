import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {PipelineStage, Model, Types } from 'mongoose';
import {
  VendorProfile,
  VendorProfileDocument,
} from './schemas/vendor-profile.schema';
import { VendorKyc, VendorKycDocument } from './schemas/vendor-kyc.schema';
import { UsersService } from '../users/users.service';
import { UploadsService } from '../uploads/uploads.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateVendorProfileDto } from './dto/create-vendor-profile.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { SubmitVendorKycDto } from './dto/submit-vendor-kyc.dto';
import { VendorStatus } from './enums/vendor-status.enum';
import { MailService } from '../mail/mail.service';
import { Product, ProductDocument } from '../product/schemas/product.schema';
import { ProductStatus } from '../product/enums/product-status.enum';
import {
  VendorFollow,
  VendorFollowDocument,
} from '../vendor-follow/schemas/vendor-follow.schema';
import { VendorFollowService } from 'src/vendor-follow/vendor-follow.service';

@Injectable()
export class VendorService {
   
constructor(
  @InjectModel(VendorProfile.name)
  private readonly vendorProfileModel: Model<VendorProfileDocument>,
  @InjectModel(VendorKyc.name)
  private readonly vendorKycModel: Model<VendorKycDocument>,
  @InjectModel(Product.name)
  private readonly productModel: Model<ProductDocument>,
  @InjectModel(VendorFollow.name)
  private readonly vendorFollowModel: Model<VendorFollowDocument>,
  private readonly usersService: UsersService,
  private readonly uploadsService: UploadsService,
  private readonly cloudinaryService: CloudinaryService,
  private readonly mailService: MailService,
  private readonly vendorFollowService: VendorFollowService,
) {}
  async becomeVendor(userId: string) {
    const user = await this.usersService.addVendorRole(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'Vendor access enabled successfully',
      data: user,
    };
  }

  async createOrUpdateVendorProfile(
    userId: string,
    dto: CreateVendorProfileDto | UpdateVendorProfileDto,
    logo?: Express.Multer.File,
    banner?: Express.Multer.File,
  ) {
    const existingProfile = await this.vendorProfileModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!existingProfile) {
      if (!dto.storeName || !dto.storeDescription || !dto.storeCategory) {
        throw new BadRequestException(
          'storeName, storeDescription and storeCategory are required',
        );
      }

      if (!logo || !banner) {
        throw new BadRequestException(
          'Store logo and store banner are required for first-time setup',
        );
      }

      const uploadedLogo = await this.uploadsService.uploadSingle(
        logo,
        'vendor-logo',
      );

      const uploadedBanner = await this.uploadsService.uploadSingle(
        banner,
        'vendor-banner',
      );

      const profile = await this.vendorProfileModel.create({
        userId: new Types.ObjectId(userId),
        storeName: dto.storeName,
        storeDescription: dto.storeDescription,
        storeCategory: dto.storeCategory,
        storeLogoUrl: uploadedLogo.url,
        storeLogoPublicId: uploadedLogo.publicId,
        storeBannerUrl: uploadedBanner.url,
        storeBannerPublicId: uploadedBanner.publicId,
        onboardingStatus: VendorStatus.DRAFT,
        rejectionReason: '',
      });

      return {
        message: 'Vendor store profile created successfully',
        data: profile,
      };
    }

    const updatePayload: Partial<VendorProfile> = {};

    if (dto.storeName !== undefined) {
      updatePayload.storeName = dto.storeName;
    }

    if (dto.storeDescription !== undefined) {
      updatePayload.storeDescription = dto.storeDescription;
    }

    if (dto.storeCategory !== undefined) {
      updatePayload.storeCategory = dto.storeCategory;
    }

    if (logo) {
      const uploadedLogo = await this.uploadsService.uploadSingle(
        logo,
        'vendor-logo',
      );

      if (existingProfile.storeLogoPublicId) {
        await this.cloudinaryService.deleteFile(
          existingProfile.storeLogoPublicId,
          'image',
        );
      }

      updatePayload.storeLogoUrl = uploadedLogo.url;
      updatePayload.storeLogoPublicId = uploadedLogo.publicId;
    }

    if (banner) {
      const uploadedBanner = await this.uploadsService.uploadSingle(
        banner,
        'vendor-banner',
      );

      if (existingProfile.storeBannerPublicId) {
        await this.cloudinaryService.deleteFile(
          existingProfile.storeBannerPublicId,
          'image',
        );
      }

      updatePayload.storeBannerUrl = uploadedBanner.url;
      updatePayload.storeBannerPublicId = uploadedBanner.publicId;
    }

    const updatedProfile = await this.vendorProfileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      updatePayload,
      { returnDocument: 'after' },
    );

    return {
      message: 'Vendor store profile updated successfully',
      data: updatedProfile,
    };
  }

  async submitKyc(
    userId: string,
    dto: SubmitVendorKycDto,
    governmentIdDocument: Express.Multer.File,
    proofOfAddressDocument: Express.Multer.File,
  ) {
    const profile = await this.vendorProfileModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!profile) {
      throw new BadRequestException(
        'Create your vendor store profile before submitting KYC',
      );
    }

    const uploadedGovernmentId = await this.uploadsService.uploadSingle(
      governmentIdDocument,
      'government-id',
    );

    const uploadedProofOfAddress = await this.uploadsService.uploadSingle(
      proofOfAddressDocument,
      'proof-of-address',
    );

    const existingKyc = await this.vendorKycModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    let kyc: VendorKycDocument | null = null;

    if (!existingKyc) {
      kyc = await this.vendorKycModel.create({
        userId: new Types.ObjectId(userId),
        governmentIdType: dto.governmentIdType,
        governmentIdDocumentUrl: uploadedGovernmentId.url,
        governmentIdDocumentPublicId: uploadedGovernmentId.publicId,
        proofOfAddressDocumentUrl: uploadedProofOfAddress.url,
        proofOfAddressDocumentPublicId: uploadedProofOfAddress.publicId,
        status: VendorStatus.PENDING_REVIEW,
        rejectionReason: '',
      });
    } else {
      if (existingKyc.governmentIdDocumentPublicId) {
        await this.cloudinaryService.deleteFile(
          existingKyc.governmentIdDocumentPublicId,
          'raw',
        );
      }

      if (existingKyc.proofOfAddressDocumentPublicId) {
        await this.cloudinaryService.deleteFile(
          existingKyc.proofOfAddressDocumentPublicId,
          'raw',
        );
      }

      kyc = await this.vendorKycModel.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        {
          governmentIdType: dto.governmentIdType,
          governmentIdDocumentUrl: uploadedGovernmentId.url,
          governmentIdDocumentPublicId: uploadedGovernmentId.publicId,
          proofOfAddressDocumentUrl: uploadedProofOfAddress.url,
          proofOfAddressDocumentPublicId: uploadedProofOfAddress.publicId,
          status: VendorStatus.PENDING_REVIEW,
          rejectionReason: '',
        },
        { returnDocument: 'after' },
      );
    }

    await this.vendorProfileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        onboardingStatus: VendorStatus.PENDING_REVIEW,
        rejectionReason: '',
      },
      { returnDocument: 'after' },
    );

    await this.usersService.markVendorOnboardingComplete(userId);

    return {
      message: 'Vendor KYC submitted successfully and is pending review',
      data: kyc,
    };
  }

  async getMyVendorProfile(userId: string) {
    const profile = await this.vendorProfileModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!profile) {
      throw new NotFoundException('Vendor profile not found');
    }

    const kyc = await this.vendorKycModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    return {
      message: 'Vendor onboarding fetched successfully',
      data: {
        profile,
        kyc,
      },
    };
  }

  
    async adminGetStores(params: {
    status?: VendorStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search } = params;
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (status) {
      query.onboardingStatus = status;
    }

    if (search) {
      query.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { storeCategory: { $regex: search, $options: 'i' } },
        { storeDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const [stores, total] = await Promise.all([
      this.vendorProfileModel
        .find(query)
        .populate('userId', 'fullName email phone country roles isVendor')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.vendorProfileModel.countDocuments(query),
    ]);

    return {
      message: 'Vendor stores fetched successfully',
      data: stores,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adminGetKycs(params: {
    status?: VendorStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search } = params;
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const baseQuery: Record<string, any> = {};

    if (status) {
      baseQuery.status = status;
    }

    let kycs = await this.vendorKycModel
      .find(baseQuery)
      .populate('userId', 'fullName email phone country roles isVendor')
      .sort({ createdAt: -1 });

    if (search) {
      const normalized = search.toLowerCase();
      kycs = kycs.filter((item: any) => {
        const user = item.userId;
        if (!user) return false;

        return (
          user.fullName?.toLowerCase().includes(normalized) ||
          user.email?.toLowerCase().includes(normalized) ||
          user.phone?.toLowerCase().includes(normalized)
        );
      });
    }

    const total = kycs.length;
    const paginatedKycs = kycs.slice(skip, skip + limit);

    return {
      message: 'Vendor KYC submissions fetched successfully',
      data: paginatedKycs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adminApproveStore(vendorProfileId: string) {
    const store = await this.vendorProfileModel
      .findById(vendorProfileId)
      .populate('userId', 'fullName email');

    if (!store) {
      throw new NotFoundException('Vendor store not found');
    }

    store.onboardingStatus = VendorStatus.APPROVED;
    store.rejectionReason = '';
    await store.save();

    const user: any = store.userId;

    const name = user.fullName;
    if (user?.email) {
      await this.mailService.sendVendorApprovedEmail(user.email, name);
    }

    return {
      message: 'Vendor store approved successfully',
      data: store,
    };
  }

  async adminRejectStore(vendorProfileId: string, reason: string) {
    if (!reason) {
      throw new BadRequestException('Rejection reason is required');
    }

    const store = await this.vendorProfileModel
      .findById(vendorProfileId)
      .populate('userId', 'fullName email');

    if (!store) {
      throw new NotFoundException('Vendor store not found');
    }

    store.onboardingStatus = VendorStatus.REJECTED;
    store.rejectionReason = reason;
    await store.save();

    const user: any = store.userId;

    const name = user.fullName;
    if (user?.email) {
      await this.mailService.sendVendorRejectedEmail(user.email, name , reason);
    }

    return {
      message: 'Vendor store rejected successfully',
      data: store,
    };
  }

  async adminApproveKyc(vendorKycId: string) {
    const kyc = await this.vendorKycModel
      .findById(vendorKycId)
      .populate('userId', 'fullName email');

    if (!kyc) {
      throw new NotFoundException('Vendor KYC not found');
    }

    kyc.status = VendorStatus.APPROVED;
    kyc.rejectionReason = '';
    await kyc.save();

    const store = await this.vendorProfileModel.findOne({
      userId: kyc.userId,
    });

    if (store) {
      store.onboardingStatus = VendorStatus.APPROVED;
      store.rejectionReason = '';
      await store.save();
    }

    const user: any = kyc.userId;

    const name = user.fullName;
    if (user?.email) {
      await this.mailService.sendVendorApprovedEmail(user.email, name);
    }

    return {
      message: 'Vendor KYC approved successfully',
      data: kyc,
    };
  }

  async adminRejectKyc(vendorKycId: string, reason: string) {
    if (!reason) {
      throw new BadRequestException('Rejection reason is required');
    }

    const kyc = await this.vendorKycModel
      .findById(vendorKycId)
      .populate('userId', 'fullName email');

    if (!kyc) {
      throw new NotFoundException('Vendor KYC not found');
    }

    kyc.status = VendorStatus.REJECTED;
    kyc.rejectionReason = reason;
    await kyc.save();

    const store = await this.vendorProfileModel.findOne({
      userId: kyc.userId,
    });

    if (store) {
      store.onboardingStatus = VendorStatus.REJECTED;
      store.rejectionReason = reason;
      await store.save();
    }

    const user: any = kyc.userId;

    const name = user.fullName;
    if (user?.email) {
      await this.mailService.sendVendorRejectedEmail(user.email, name, reason);
    }

    return {
      message: 'Vendor KYC rejected successfully',
      data: kyc,
    };
  }




async getVendorPublicDetails(
  vendorProfileId: string,
  query?: { page?: number; limit?: number },
) {
  const page = Math.max(1, Number(query?.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
  const skip = (page - 1) * limit;

  const vendorProfileObjectId = new Types.ObjectId(vendorProfileId);

  const vendorDetailsPipeline: PipelineStage[] = [
    {
      $match: {
        _id: vendorProfileObjectId,
        onboardingStatus: VendorStatus.APPROVED,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'vendorUser',
      },
    },
    {
      $unwind: '$vendorUser',
    },
    {
      $lookup: {
        from: 'vendorfollows',
        localField: '_id',
        foreignField: 'vendorProfileId',
        as: 'followers',
      },
    },
    {
      $project: {
        _id: 1,
        storeName: 1,
        storeDescription: 1,
        storeCategory: 1,
        storeLogoUrl: 1,
        storeBannerUrl: 1,
        onboardingStatus: 1,
        vendorUser: {
          _id: '$vendorUser._id',
          fullName: '$vendorUser.fullName',
          email: '$vendorUser.email',
          country: '$vendorUser.country',
        },
        followersCount: { $size: '$followers' },
      },
    },
  ];

  const vendorDetailsResult = await this.vendorProfileModel.aggregate(
    vendorDetailsPipeline,
  );

  if (!vendorDetailsResult.length) {
    throw new NotFoundException('Vendor not found');
  }

  const vendorDetails = vendorDetailsResult[0];

  const productsPipeline: PipelineStage[] = [
    {
      $match: {
        vendorProfileId: vendorProfileObjectId,
        status: ProductStatus.APPROVED,
        isDeleted: false,
      },
    },
    {
      $sort: { createdAt: -1 as const },
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              vendorId: 1,
              vendorProfileId: 1,
              name: 1,
              description: 1,
              category: 1,
              tags: 1,
              images: 1,
              price: 1,
              discountPrice: 1,
              quantity: 1,
              sku: 1,
              hasVariants: 1,
              variants: 1,
              status: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
  ];

  const productsAggregation = await this.productModel.aggregate(productsPipeline);

  const productsMeta = productsAggregation[0]?.metadata?.[0];
  const totalProducts = productsMeta?.total || 0;
  const products = productsAggregation[0]?.data || [];

  const relatedVendorsPipeline: PipelineStage[] = [
    {
      $match: {
        _id: { $ne: vendorProfileObjectId },
        onboardingStatus: VendorStatus.APPROVED,
        storeCategory: vendorDetails.storeCategory,
      },
    },
    {
      $lookup: {
        from: 'vendorfollows',
        localField: '_id',
        foreignField: 'vendorProfileId',
        as: 'followers',
      },
    },
    {
      $lookup: {
        from: 'products',
        let: { relatedVendorProfileId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$vendorProfileId', '$$relatedVendorProfileId'] },
                  { $eq: ['$status', ProductStatus.APPROVED] },
                  { $eq: ['$isDeleted', false] },
                ],
              },
            },
          },
          {
            $count: 'count',
          },
        ],
        as: 'approvedProductsMeta',
      },
    },
    {
      $project: {
        _id: 1,
        storeName: 1,
        storeDescription: 1,
        storeCategory: 1,
        storeLogoUrl: 1,
        storeBannerUrl: 1,
        createdAt: 1,
        followersCount: { $size: '$followers' },
        approvedProductsCount: {
          $ifNull: [{ $arrayElemAt: ['$approvedProductsMeta.count', 0] }, 0],
        },
      },
    },
    {
      $sort: {
        followersCount: -1 as const,
        approvedProductsCount: -1 as const,
        createdAt: -1 as const,
      },
    },
    {
      $limit: 6,
    },
    {
      $project: {
        createdAt: 0,
      },
    },
  ];

  const relatedVendors = await this.vendorProfileModel.aggregate(
    relatedVendorsPipeline,
  );

  return {
    message: 'Vendor details fetched successfully',
    data: {
      vendor: {
        id: vendorDetails.vendorUser._id,
        fullName: vendorDetails.vendorUser.fullName,
        email: vendorDetails.vendorUser.email,
        country: vendorDetails.vendorUser.country,
      },
      store: {
        id: vendorDetails._id,
        storeName: vendorDetails.storeName,
        storeDescription: vendorDetails.storeDescription,
        storeCategory: vendorDetails.storeCategory,
        storeLogoUrl: vendorDetails.storeLogoUrl,
        storeBannerUrl: vendorDetails.storeBannerUrl,
        onboardingStatus: vendorDetails.onboardingStatus,
      },
      followersCount: vendorDetails.followersCount,
      products,
      relatedVendors,
    },
    meta: {
      page,
      limit,
      totalProducts,
      totalProductPages: Math.ceil(totalProducts / limit),
    },
  };
}
}