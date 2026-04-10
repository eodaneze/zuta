import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PickupLocation,
  PickupLocationDocument,
} from './schemas/pickup-location.schema';
import {
  ProductCategory,
  ProductCategoryDocument,
} from './schemas/product-category.schema';
import {
  DeliverySettings,
  DeliverySettingsDocument,
} from './schemas/delivery-settings.schema';
import { CreatePickupLocationDto } from './dto/create-pickup-location.dto';
import { UpdatePickupLocationDto } from './dto/update-pickup-location.dto';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { UpsertDeliverySettingsDto } from './dto/upsert-delivery-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(PickupLocation.name)
    private readonly pickupLocationModel: Model<PickupLocationDocument>,
    @InjectModel(ProductCategory.name)
    private readonly productCategoryModel: Model<ProductCategoryDocument>,
    @InjectModel(DeliverySettings.name)
    private readonly deliverySettingsModel: Model<DeliverySettingsDocument>,
  ) {}

  async createPickupLocation(dto: CreatePickupLocationDto) {

    const existing = await this.pickupLocationModel.findOne({
      name: dto.name.trim(),
    });

    if (existing) {
      throw new BadRequestException('Pickup location already exists');
    }

    const pickupLocation = await this.pickupLocationModel.create({
      contactPerson: dto.contactPerson.trim(),
      phone: dto.phone.trim(),
      name: dto.name.trim(),
      address: dto.address.trim(),
      city: dto.city?.trim() || '',
      state: dto.state?.trim() || '',
      country: dto.country?.trim() || '',
      isActive: true,
    });

    return {
      message: 'Pickup location created successfully',
      data: pickupLocation,
    };
  }

  async updatePickupLocation(
    pickupLocationId: string,
    dto: UpdatePickupLocationDto,
  ) {
    const pickupLocation = await this.pickupLocationModel.findById(
      pickupLocationId,
    );

    if (!pickupLocation) {
      throw new NotFoundException('Pickup location not found');
    }

    if (dto.name && dto.name.trim() !== pickupLocation.name) {
      const existing = await this.pickupLocationModel.findOne({
        name: dto.name.trim(),
        _id: { $ne: pickupLocationId },
      });

      if (existing) {
        throw new BadRequestException('Pickup location already exists');
      }

      pickupLocation.name = dto.name.trim();
    }

    if (dto.address !== undefined) pickupLocation.address = dto.address.trim();
    if (dto.city !== undefined) pickupLocation.city = dto.city.trim();
    if (dto.state !== undefined) pickupLocation.state = dto.state.trim();
    if (dto.country !== undefined) pickupLocation.country = dto.country.trim();

    await pickupLocation.save();

    return {
      message: 'Pickup location updated successfully',
      data: pickupLocation,
    };
  }

  async togglePickupLocation(pickupLocationId: string) {
    const pickupLocation = await this.pickupLocationModel.findById(
      pickupLocationId,
    );

    if (!pickupLocation) {
      throw new NotFoundException('Pickup location not found');
    }

    pickupLocation.isActive = !pickupLocation.isActive;
    await pickupLocation.save();

    return {
      message: `Pickup location ${
        pickupLocation.isActive ? 'activated' : 'deactivated'
      } successfully`,
      data: pickupLocation,
    };
  }

  async getPickupLocations(isActive?: boolean) {
    const filter =
      typeof isActive === 'boolean'
        ? { isActive }
        : {};

    const pickupLocations = await this.pickupLocationModel
      .find(filter)
      .sort({ createdAt: -1 });

    return {
      message: 'Pickup locations fetched successfully',
      data: pickupLocations,
    };
  }

  async createProductCategory(dto: CreateProductCategoryDto) {
    const existing = await this.productCategoryModel.findOne({
      name: dto.name.trim(),
    });

    if (existing) {
      throw new BadRequestException('Product category already exists');
    }

    const category = await this.productCategoryModel.create({
      name: dto.name.trim(),
      description: dto.description?.trim() || '',
      isActive: true,
    });

    return {
      message: 'Product category created successfully',
      data: category,
    };
  }

  async updateProductCategory(
    categoryId: string,
    dto: UpdateProductCategoryDto,
  ) {
    const category = await this.productCategoryModel.findById(categoryId);

    if (!category) {
      throw new NotFoundException('Product category not found');
    }

    if (dto.name && dto.name.trim() !== category.name) {
      const existing = await this.productCategoryModel.findOne({
        name: dto.name.trim(),
        _id: { $ne: categoryId },
      });

      if (existing) {
        throw new BadRequestException('Product category already exists');
      }

      category.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      category.description = dto.description.trim();
    }

    await category.save();

    return {
      message: 'Product category updated successfully',
      data: category,
    };
  }

  async toggleProductCategory(categoryId: string) {
    const category = await this.productCategoryModel.findById(categoryId);

    if (!category) {
      throw new NotFoundException('Product category not found');
    }

    category.isActive = !category.isActive;
    await category.save();

    return {
      message: `Product category ${
        category.isActive ? 'activated' : 'deactivated'
      } successfully`,
      data: category,
    };
  }

  async getProductCategories(isActive?: boolean) {
    const filter =
      typeof isActive === 'boolean'
        ? { isActive }
        : {};

    const categories = await this.productCategoryModel
      .find(filter)
      .sort({ name: 1 });

    return {
      message: 'Product categories fetched successfully',
      data: categories,
    };
  }

  async upsertDeliverySettings(dto: UpsertDeliverySettingsDto) {
    const existing = await this.deliverySettingsModel.findOne();

    if (!existing) {
      const settings = await this.deliverySettingsModel.create({
        shippingFee: dto.shippingFee,
        homeDeliveryFee: dto.homeDeliveryFee,
      });

      return {
        message: 'Delivery settings created successfully',
        data: settings,
      };
    }

    existing.shippingFee = dto.shippingFee;
    existing.homeDeliveryFee = dto.homeDeliveryFee;
    await existing.save();

    return {
      message: 'Delivery settings updated successfully',
      data: existing,
    };
  }

  async getDeliverySettings() {
    let settings = await this.deliverySettingsModel.findOne();

    if (!settings) {
      settings = await this.deliverySettingsModel.create({
        shippingFee: 0,
        homeDeliveryFee: 0,
      });
    }

    return {
      message: 'Delivery settings fetched successfully',
      data: settings,
    };
  }
}