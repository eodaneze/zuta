import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

@Injectable()
export class VendorService {
  constructor(
    @InjectModel(VendorProfile.name)
    private readonly vendorProfileModel: Model<VendorProfileDocument>,
    @InjectModel(VendorKyc.name)
    private readonly vendorKycModel: Model<VendorKycDocument>,
    private readonly usersService: UsersService,
    private readonly uploadsService: UploadsService,
    private readonly cloudinaryService: CloudinaryService,
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
      { new: true },
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
        { new: true },
      );
    }

    await this.vendorProfileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        onboardingStatus: VendorStatus.PENDING_REVIEW,
        rejectionReason: '',
      },
      { new: true },
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
}