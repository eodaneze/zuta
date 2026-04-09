import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { AdminReviewDto } from './dto/admin-review.dto';
import { AdminQueryUsersDto } from './dto/admin-query-users.dto';
import { AdminQueryVendorStoreDto } from './dto/admin-query-vendor-store.dto';
import { AdminQueryVendorKycDto } from './dto/admin-query-vendor-kyc.dto';
import { AdminQueryProductsDto } from '../product/dto/admin-query-products.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users with search, role filter and pagination' })
  getUsers(@Query() query: AdminQueryUsersDto) {
    return this.adminService.getUsers(query);
  }

  @Get('stores')
  @ApiOperation({ summary: 'Get all vendor stores with status filter and pagination' })
  getStores(@Query() query: AdminQueryVendorStoreDto) {
    return this.adminService.getStores(query);
  }

  @Get('kycs')
  @ApiOperation({ summary: 'Get all vendor KYC submissions with status filter and pagination' })
  getKycs(@Query() query: AdminQueryVendorKycDto) {
    return this.adminService.getKycs(query);
  }

  @Patch('stores/:vendorProfileId/approve')
  @ApiOperation({ summary: 'Approve vendor store' })
  approveStore(@Param('vendorProfileId') vendorProfileId: string) {
    return this.adminService.approveStore(vendorProfileId);
  }

  @Patch('stores/:vendorProfileId/reject')
  @ApiOperation({ summary: 'Reject vendor store with reason' })
  rejectStore(
    @Param('vendorProfileId') vendorProfileId: string,
    @Body() dto: AdminReviewDto,
  ) {
    return this.adminService.rejectStore(vendorProfileId, dto.reason || '');
  }

  @Patch('kycs/:vendorKycId/approve')
  @ApiOperation({ summary: 'Approve vendor KYC' })
  approveKyc(@Param('vendorKycId') vendorKycId: string) {
    return this.adminService.approveKyc(vendorKycId);
  }

  @Patch('kycs/:vendorKycId/reject')
  @ApiOperation({ summary: 'Reject vendor KYC with reason' })
  rejectKyc(
    @Param('vendorKycId') vendorKycId: string,
    @Body() dto: AdminReviewDto,
  ) {
    return this.adminService.rejectKyc(vendorKycId, dto.reason || '');
  }

  @Get('products')
  @ApiOperation({ summary: 'Get all products with search, filter and pagination' })
  getProducts(@Query() query: AdminQueryProductsDto) {
    return this.adminService.getProducts(query);
  }

  @Patch('products/:productId/approve')
  @ApiOperation({ summary: 'Approve product' })
  approveProduct(@Param('productId') productId: string) {
    return this.adminService.approveProduct(productId);
  }

  @Patch('products/:productId/reject')
  @ApiOperation({ summary: 'Reject product with reason' })
  rejectProduct(
    @Param('productId') productId: string,
    @Body() dto: AdminReviewDto,
  ) {
    return this.adminService.rejectProduct(productId, dto.reason || '');
  }
}