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
import { VendorProfile, VendorProfileDocument } from '../vendor/schemas/vendor-profile.schema';
import { VendorKyc, VendorKycDocument } from '../vendor/schemas/vendor-kyc.schema';
import { VendorStatus } from '../vendor/enums/vendor-status.enum';
import { ProductStatus } from './enums/product-status.enum';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(VendorProfile.name)
    private readonly vendorProfileModel: Model<VendorProfileDocument>,
    @InjectModel(VendorKyc.name)
    private readonly vendorKycModel: Model<VendorKycDocument>,
    private readonly uploadsService: UploadsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private async validateApprovedVendor(userId: string) {
    const vendorProfile = await this.vendorProfileModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    console.log(`the vendor is is ${userId}` )
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

    const filter:  Record<string, any> = {
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
      this.productModel
        .find(filter)
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
}