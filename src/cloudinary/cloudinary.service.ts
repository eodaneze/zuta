import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadBuffer(
    file: Express.Multer.File,
    options: UploadApiOptions,
  ): Promise<UploadApiResponse> {
    try {
      return await new Promise<UploadApiResponse>((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          options,
          (error, result) => {
            if (error || !result) {
              return reject(error);
            }
            resolve(result);
          },
        );

        Readable.from(file.buffer).pipe(upload);
      });
    } catch (error) {
      throw new InternalServerErrorException('Cloudinary upload failed');
    }
  }

  async deleteFile(publicId: string, resourceType: 'image' | 'raw' | 'video' = 'image') {
    try {
      return await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    } catch (error) {
      throw new InternalServerErrorException('Cloudinary delete failed');
    }
  }
}