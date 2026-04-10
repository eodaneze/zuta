import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UploadsService } from '../uploads/uploads.service';
import {
  VendorProfile,
  VendorProfileDocument,
} from '../vendor/schemas/vendor-profile.schema';
import { VendorKyc, VendorKycDocument } from '../vendor/schemas/vendor-kyc.schema';
import { VendorStatus } from '../vendor/enums/vendor-status.enum';
import { ProductStatus } from './enums/product-status.enum';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MailService } from '../mail/mail.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/enums/notification-type.enum';
import { connect } from 'http2';
import { User, UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(VendorProfile.name)
    private readonly vendorProfileModel: Model<VendorProfileDocument>,
    @InjectModel(VendorKyc.name)
    private readonly vendorKycModel: Model<VendorKycDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly uploadsService: UploadsService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
  ) {}

  private async validateApprovedVendor(userId: string) {
    const vendorProfile = await this.vendorProfileModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!vendorProfile) {
      throw new ForbiddenException('Vendor store profile not found');
    }

    const vendorKyc = await this.vendorKycModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!vendorKyc) {
      throw new ForbiddenException('Vendor KYC not found');
    }

    if (vendorProfile.onboardingStatus !== VendorStatus.APPROVED) {
      throw new ForbiddenException(
        'Your store has not been approved to list products yet',
      );
    }

    if (vendorKyc.status !== VendorStatus.APPROVED) {
      throw new ForbiddenException(
        'Your KYC has not been approved to list products yet',
      );
    }

    return { vendorProfile, vendorKyc };
  }

  async createProduct(
    userId: string,
    dto: CreateProductDto,
    files: Express.Multer.File[],
  ) {
    const { vendorProfile } = await this.validateApprovedVendor(userId);

    if (!files || files.length === 0) {
      throw new BadRequestException('At least one product image is required');
    }

    if (dto.discountPrice && dto.discountPrice > dto.price) {
      throw new BadRequestException('Discount price cannot be greater than price');
    }

    const existingSku = await this.productModel.findOne({
      sku: dto.sku.trim(),
      isDeleted: false,
    });

    if (existingSku) {
      throw new BadRequestException('Product SKU already exists');
    }

    const uploadedImages = await this.uploadsService.uploadMany(
      files,
      'product-image',
    );

    const product = await this.productModel.create({
      vendorId: new Types.ObjectId(userId),
      vendorProfileId: vendorProfile._id,
      name: dto.name,
      description: dto.description || '',
      category: dto.category,
      tags: dto.tags || [],
      images: uploadedImages.map((img) => ({
        url: img.url,
        publicId: img.publicId,
      })),
      price: dto.price,
      discountPrice: dto.discountPrice ?? null,
      quantity: dto.quantity,
      sku: dto.sku.trim(),
      hasVariants: dto.hasVariants ?? false,
      variants: dto.variants || [],
      status: ProductStatus.PENDING,
      rejectionReason: '',
      isDeleted: false,
    });

    return {
      message: 'Product created successfully and is pending approval',
      data: product,
    };
  }

  async getMyProducts(userId: string, query: ProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      vendorId: new Types.ObjectId(userId),
      isDeleted: false,
    };

    if (query.category) {
      filter.category = query.category;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { sku: { $regex: query.search, $options: 'i' } },
        { category: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.productModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.productModel.countDocuments(filter),
    ]);

    return {
      message: 'Products fetched successfully',
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMySingleProduct(userId: string, productId: string) {
    const product = await this.productModel.findOne({
      _id: productId,
      vendorId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      message: 'Product fetched successfully',
      data: product,
    };
  }

  async updateMyProduct(
    userId: string,
    productId: string,
    dto: UpdateProductDto,
    files?: Express.Multer.File[],
  ) {
    const product = await this.productModel.findOne({
      _id: productId,
      vendorId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.discountPrice && dto.price && dto.discountPrice > dto.price) {
      throw new BadRequestException('Discount price cannot be greater than price');
    }

    if (dto.discountPrice && !dto.price && dto.discountPrice > product.price) {
      throw new BadRequestException('Discount price cannot be greater than price');
    }

    if (dto.sku && dto.sku.trim() !== product.sku) {
      const existingSku = await this.productModel.findOne({
        sku: dto.sku.trim(),
        _id: { $ne: product._id },
        isDeleted: false,
      });

      if (existingSku) {
        throw new BadRequestException('Product SKU already exists');
      }
    }

    if (files && files.length > 0) {
      for (const image of product.images) {
        await this.cloudinaryService.deleteFile(image.publicId, 'image');
      }

      const uploadedImages = await this.uploadsService.uploadMany(
        files,
        'product-image',
      );

      product.images = uploadedImages.map((img) => ({
        url: img.url,
        publicId: img.publicId,
      })) as any;
    }

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.category !== undefined) product.category = dto.category;
    if (dto.tags !== undefined) product.tags = dto.tags;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.discountPrice !== undefined) product.discountPrice = dto.discountPrice;
    if (dto.quantity !== undefined) product.quantity = dto.quantity;
    if (dto.sku !== undefined) product.sku = dto.sku.trim();
    if (dto.hasVariants !== undefined) product.hasVariants = dto.hasVariants;
    if (dto.variants !== undefined) product.variants = dto.variants as any;

    product.status = ProductStatus.PENDING;
    product.rejectionReason = '';

    await product.save();

    return {
      message: 'Product updated successfully and sent for review',
      data: product,
    };
  }

  async deleteMyProduct(userId: string, productId: string) {
    const product = await this.productModel.findOne({
      _id: productId,
      vendorId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.isDeleted = true;
    await product.save();

    return {
      message: 'Product deleted successfully',
    };
  }

  async adminGetProducts(query: {
    search?: string;
    category?: string;
    status?: ProductStatus;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      isDeleted: false,
    };

    if (query.category) {
      filter.category = query.category;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { sku: { $regex: query.search, $options: 'i' } },
        { category: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('vendorId', 'fullName email phone')
        .populate('vendorProfileId', 'storeName storeCategory')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.productModel.countDocuments(filter),
    ]);

    return {
      message: 'Products fetched successfully',
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adminApproveProduct(productId: string) {
    const product = await this.productModel
      .findOne({
        _id: productId,
        isDeleted: false,
      })
      .populate('vendorId', 'fullName email');

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.status = ProductStatus.APPROVED;
    product.rejectionReason = '';
    await product.save();

    const vendor: any = product.vendorId;

    const name = vendor.fullName;
    const productName = product.name;
    if (vendor?.email) {
      await this.mailService.sendProductApprovedEmail(vendor.email, name, productName);
    }

    await this.notificationService.createNotification({
      userId: vendor._id.toString(),
      title: 'Product approved',
      message: `Your product "${product.name}" has been approved.`,
      type: NotificationType.PRODUCT_APPROVED,
      metadata: {
        productId: product._id,
        productName: product.name,
        status: ProductStatus.APPROVED,
      },
    });

    await this.notificationService.sendBrowserPushToUser(
      vendor._id.toString(),
      {
        title: 'Product approved',
        body: `Your product "${product.name}" has been approved.`,
        url: '/vendor/products',
      },
    );

    return {
      message: 'Product approved successfully',
      data: product,
    };
  }

  async adminRejectProduct(productId: string, reason: string) {
    if (!reason) {
      throw new BadRequestException('Rejection reason is required');
    }

    const product = await this.productModel
      .findOne({
        _id: productId,
        isDeleted: false,
      })
      .populate('vendorId', 'fullName email');

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.status = ProductStatus.REJECTED;
    product.rejectionReason = reason;
    await product.save();

    const vendor: any = product.vendorId;

    const name = vendor.fullName;
    const productName = product.name;
    if (vendor?.email) {
      await this.mailService.sendProductRejectedEmail(vendor.email, name, productName, reason);
    }

    await this.notificationService.createNotification({
      userId: vendor._id.toString(),
      title: 'Product rejected',
      message: `Your product "${product.name}" was rejected. Reason: ${reason}`,
      type: NotificationType.PRODUCT_REJECTED,
      metadata: {
        productId: product._id,
        productName: product.name,
        status: ProductStatus.REJECTED,
        reason,
      },
    });

    await this.notificationService.sendBrowserPushToUser(
      vendor._id.toString(),
      {
        title: 'Product rejected',
        body: `Your product "${product.name}" was rejected.`,
        url: '/vendor/products',
      },
    );

    return {
      message: 'Product rejected successfully',
      data: product,
    };
  }

   async getPublicProducts(query: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 12;
  const skip = (page - 1) * limit;

  const approvedVendorProfiles = await this.vendorProfileModel
    .find({ onboardingStatus: VendorStatus.APPROVED })
    .select('_id');

  const approvedVendorProfileIds = approvedVendorProfiles.map(
    (item) => item._id,
  );

  const filter: Record<string, any> = {
    isDeleted: false,
    status: ProductStatus.APPROVED,
    vendorProfileId: { $in: approvedVendorProfileIds },
  };

  if (query.category) {
    filter.category = query.category;
  }

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
      { sku: { $regex: query.search, $options: 'i' } },
      { category: { $regex: query.search, $options: 'i' } },
      { tags: { $elemMatch: { $regex: query.search, $options: 'i' } } },
    ];
  }

  const [products, total] = await Promise.all([
    this.productModel
      .find(filter)
      .populate('vendorId', 'fullName country')
      .populate(
        'vendorProfileId',
        'storeName storeDescription storeCategory storeLogoUrl storeBannerUrl',
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.productModel.countDocuments(filter),
  ]);

  return {
    message: 'Public products fetched successfully',
    data: products,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async getPublicSingleProduct(
  productId: string,
  query: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  },
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  const product = await this.productModel.aggregate([
    {
      $match: {
        _id: new Types.ObjectId(productId),
        status: ProductStatus.APPROVED,
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: 'vendorprofiles',
        localField: 'vendorProfileId',
        foreignField: '_id',
        as: 'vendorProfile',
      },
    },
    {
      $unwind: '$vendorProfile',
    },
    {
      $match: {
        'vendorProfile.onboardingStatus': VendorStatus.APPROVED,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendorUser',
      },
    },
    {
      $unwind: '$vendorUser',
    },
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
        vendorUser: {
          _id: '$vendorUser._id',
          fullName: '$vendorUser.fullName',
          email: '$vendorUser.email',
          country: '$vendorUser.country',
        },
        vendorProfile: {
          _id: '$vendorProfile._id',
          storeName: '$vendorProfile.storeName',
          storeDescription: '$vendorProfile.storeDescription',
          storeCategory: '$vendorProfile.storeCategory',
          storeLogoUrl: '$vendorProfile.storeLogoUrl',
          storeBannerUrl: '$vendorProfile.storeBannerUrl',
          onboardingStatus: '$vendorProfile.onboardingStatus',
        },
      },
    },
  ]);

  if (!product.length) {
    throw new NotFoundException('Product not found');
  }

  const currentProduct = product[0];

  const otherProductsFilter: Record<string, any> = {
    _id: { $ne: new Types.ObjectId(productId) },
    vendorProfileId: new Types.ObjectId(currentProduct.vendorProfile._id),
    status: ProductStatus.APPROVED,
    isDeleted: false,
  };

  if (query.category) {
    otherProductsFilter.category = query.category;
  }

  if (query.search) {
    otherProductsFilter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
      { sku: { $regex: query.search, $options: 'i' } },
      { category: { $regex: query.search, $options: 'i' } },
      { tags: { $elemMatch: { $regex: query.search, $options: 'i' } } },
    ];
  }

  const [vendorProducts, totalVendorProducts] = await Promise.all([
    this.productModel
      .find(otherProductsFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.productModel.countDocuments(otherProductsFilter),
  ]);

  return {
    message: 'Public product fetched successfully',
    data: {
      product: {
        id: currentProduct._id,
        name: currentProduct.name,
        description: currentProduct.description,
        category: currentProduct.category,
        tags: currentProduct.tags,
        images: currentProduct.images,
        price: currentProduct.price,
        discountPrice: currentProduct.discountPrice,
        quantity: currentProduct.quantity,
        sku: currentProduct.sku,
        hasVariants: currentProduct.hasVariants,
        variants: currentProduct.variants,
        status: currentProduct.status,
        createdAt: currentProduct.createdAt,
      },
      vendor: {
        id: currentProduct.vendorUser._id,
        fullName: currentProduct.vendorUser.fullName,
        email: currentProduct.vendorUser.email,
        country: currentProduct.vendorUser.country,
      },
      store: {
        id: currentProduct.vendorProfile._id,
        storeName: currentProduct.vendorProfile.storeName,
        storeDescription: currentProduct.vendorProfile.storeDescription,
        storeCategory: currentProduct.vendorProfile.storeCategory,
        storeLogoUrl: currentProduct.vendorProfile.storeLogoUrl,
        storeBannerUrl: currentProduct.vendorProfile.storeBannerUrl,
        onboardingStatus: currentProduct.vendorProfile.onboardingStatus,
      },
      vendorProducts,
    },
    meta: {
      page,
      limit,
      totalVendorProducts,
      totalVendorProductPages: Math.ceil(totalVendorProducts / limit),
    },
  };
}
}