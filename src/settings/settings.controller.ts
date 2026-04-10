import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CreatePickupLocationDto } from './dto/create-pickup-location.dto';
import { UpdatePickupLocationDto } from './dto/update-pickup-location.dto';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { UpsertDeliverySettingsDto } from './dto/upsert-delivery-settings.dto';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('pickup-locations')
  @ApiOperation({ summary: 'Get pickup locations' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  getPickupLocations(@Query('isActive') isActive?: string) {
    const parsed =
      isActive === undefined ? undefined : isActive === 'true';
    return this.settingsService.getPickupLocations(parsed);
  }

  @Get('product-categories')
  @ApiOperation({ summary: 'Get product categories' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  getProductCategories(@Query('isActive') isActive?: string) {
    const parsed =
      isActive === undefined ? undefined : isActive === 'true';
    return this.settingsService.getProductCategories(parsed);
  }

  @Get('delivery-settings')
  @ApiOperation({ summary: 'Get delivery settings' })
  getDeliverySettings() {
    return this.settingsService.getDeliverySettings();
  }

  @Post('admin/pickup-locations')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin create pickup location' })
  createPickupLocation(@Body() dto: CreatePickupLocationDto) {
    return this.settingsService.createPickupLocation(dto);
  }

  @Patch('admin/pickup-locations/:pickupLocationId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin update pickup location' })
  updatePickupLocation(
    @Param('pickupLocationId') pickupLocationId: string,
    @Body() dto: UpdatePickupLocationDto,
  ) {
    return this.settingsService.updatePickupLocation(pickupLocationId, dto);
  }

  @Patch('admin/pickup-locations/:pickupLocationId/toggle')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin activate or deactivate pickup location' })
  togglePickupLocation(@Param('pickupLocationId') pickupLocationId: string) {
    return this.settingsService.togglePickupLocation(pickupLocationId);
  }

  @Post('admin/product-categories')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin create product category' })
  createProductCategory(@Body() dto: CreateProductCategoryDto) {
    return this.settingsService.createProductCategory(dto);
  }

  @Patch('admin/product-categories/:categoryId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin update product category' })
  updateProductCategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateProductCategoryDto,
  ) {
    return this.settingsService.updateProductCategory(categoryId, dto);
  }

  @Patch('admin/product-categories/:categoryId/toggle')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin activate or deactivate product category' })
  toggleProductCategory(@Param('categoryId') categoryId: string) {
    return this.settingsService.toggleProductCategory(categoryId);
  }

  @Post('admin/delivery-settings')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin create or update delivery settings' })
  upsertDeliverySettings(@Body() dto: UpsertDeliverySettingsDto) {
    return this.settingsService.upsertDeliverySettings(dto);
  }
}