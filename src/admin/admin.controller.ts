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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { AdminReviewDto } from './dto/admin-review.dto';
import { VendorStatus } from '../vendor/enums/vendor-status.enum';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users with search and role filter' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  getUsers(
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
  ) {
    return this.adminService.getUsers(search, role);
  }

  @Get('stores')
  @ApiOperation({ summary: 'Get all vendor stores with status filter' })
  @ApiQuery({ name: 'status', required: false, enum: VendorStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  getStores(
    @Query('status') status?: VendorStatus,
    @Query('search') search?: string,
  ) {
    return this.adminService.getStores(status, search);
  }

  @Get('kycs')
  @ApiOperation({ summary: 'Get all vendor KYC submissions with status filter' })
  @ApiQuery({ name: 'status', required: false, enum: VendorStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  getKycs(
    @Query('status') status?: VendorStatus,
    @Query('search') search?: string,
  ) {
    return this.adminService.getKycs(status, search);
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
}