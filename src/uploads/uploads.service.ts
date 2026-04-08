import { BadRequestException, Injectable } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

type UploadCategory =
  | 'vendor-logo'
  | 'vendor-banner'
  | 'product-image'
  | 'government-id'
  | 'proof-of-address';

@Injectable()
export class UploadsService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  private ensureFileExists(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
  }

  async uploadSingle(file: Express.Multer.File, category: UploadCategory) {
    this.ensureFileExists(file);

    switch (category) {
      case 'vendor-logo':
        return this.uploadImage(file, 'spellamart/vendors/logos');
      case 'vendor-banner':
        return this.uploadImage(file, 'spellamart/vendors/banners');
      case 'product-image':
        return this.uploadImage(file, 'spellamart/products/images');
      case 'government-id':
        return this.uploadDocument(file, 'spellamart/vendors/kyc/government-id');
      case 'proof-of-address':
        return this.uploadDocument(file, 'spellamart/vendors/kyc/proof-of-address');
      default:
        throw new BadRequestException('Unsupported upload category');
    }
  }

  async uploadMany(files: Express.Multer.File[], category: UploadCategory) {
    if (!files?.length) {
      throw new BadRequestException('Files are required');
    }

    return Promise.all(files.map((file) => this.uploadSingle(file, category)));
  }

  private async uploadImage(file: Express.Multer.File, folder: string) {
    this.validateImage(file);

    const result = await this.cloudinaryService.uploadBuffer(file, {
      folder,
      resource_type: 'image',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      originalName: file.originalname,
      resourceType: result.resource_type,
      bytes: result.bytes,
      format: result.format,
    };
  }

  private async uploadDocument(file: Express.Multer.File, folder: string) {
    this.validateDocument(file);

    const result = await this.cloudinaryService.uploadBuffer(file, {
      folder,
      resource_type: 'raw',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      originalName: file.originalname,
      resourceType: result.resource_type,
      bytes: result.bytes,
      format: result.format,
    };
  }

  private validateImage(file: Express.Multer.File) {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only jpg, jpeg, png, and webp images are allowed',
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Image size must not exceed 5MB');
    }
  }

  private validateDocument(file: Express.Multer.File) {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only PDF, jpg, jpeg, png, and webp files are allowed',
      );
    }

    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Document size must not exceed 8MB');
    }
  }
}