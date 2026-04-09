import {
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { VendorFollowService } from './vendor-follow.service';

@ApiTags('Vendor Follow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vendor-follows')
export class VendorFollowController {
  constructor(private readonly vendorFollowService: VendorFollowService) {}

  @Post(':vendorProfileId')
  @ApiOperation({ summary: 'Follow a vendor' })
  followVendor(
    @CurrentUser() user: any,
    @Param('vendorProfileId') vendorProfileId: string,
  ) {
    return this.vendorFollowService.followVendor(
      user._id.toString(),
      vendorProfileId,
    );
  }

  @Delete(':vendorProfileId')
  @ApiOperation({ summary: 'Unfollow a vendor' })
  unfollowVendor(
    @CurrentUser() user: any,
    @Param('vendorProfileId') vendorProfileId: string,
  ) {
    return this.vendorFollowService.unfollowVendor(
      user._id.toString(),
      vendorProfileId,
    );
  }
}