import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { VendorService } from './vendor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BecomeVendorDto } from './dto/become-vendor.dto';
import { CreateVendorProfileDto } from './dto/create-vendor-profile.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { SubmitVendorKycDto } from './dto/submit-vendor-kyc.dto';

@ApiTags('Vendor')
@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Get(':vendorProfileId')
  @ApiOperation({ summary: 'Get public vendor details' })
  getVendorPublicDetails(@Param('vendorProfileId') vendorProfileId: string) {
    return this.vendorService.getVendorPublicDetails(vendorProfileId);
  }

  @Post('become-vendor')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enable vendor access for the current user' })
  becomeVendor(@CurrentUser() user: any, @Body() _dto: BecomeVendorDto) {
    return this.vendorService.becomeVendor(user._id.toString());
  }

  @Post('store-profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create vendor store profile with logo and banner' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        storeName: { type: 'string' },
        storeDescription: { type: 'string' },
        storeCategory: { type: 'string' },
        logo: { type: 'string', format: 'binary' },
        banner: { type: 'string', format: 'binary' },
      },
      required: ['storeName', 'storeDescription', 'storeCategory', 'logo', 'banner'],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  createStoreProfile(
    @CurrentUser() user: any,
    @Body() dto: CreateVendorProfileDto,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      banner?: Express.Multer.File[];
    },
  ) {
    const logo = files?.logo?.[0];
    const banner = files?.banner?.[0];

    return this.vendorService.createOrUpdateVendorProfile(
      user._id.toString(),
      dto,
      logo,
      banner,
    );
  }

  @Patch('store-profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update vendor store profile' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        storeName: { type: 'string' },
        storeDescription: { type: 'string' },
        storeCategory: { type: 'string' },
        logo: { type: 'string', format: 'binary' },
        banner: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  updateStoreProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateVendorProfileDto,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      banner?: Express.Multer.File[];
    },
  ) {
    const logo = files?.logo?.[0];
    const banner = files?.banner?.[0];

    return this.vendorService.createOrUpdateVendorProfile(
      user._id.toString(),
      dto,
      logo,
      banner,
    );
  }

  @Post('kyc')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit vendor KYC documents' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        governmentIdType: {
          type: 'string',
          enum: ['nin', 'voters_card', 'drivers_license', 'international_passport'],
        },
        governmentIdDocument: { type: 'string', format: 'binary' },
        proofOfAddressDocument: { type: 'string', format: 'binary' },
      },
      required: ['governmentIdType', 'governmentIdDocument', 'proofOfAddressDocument'],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'governmentIdDocument', maxCount: 1 },
      { name: 'proofOfAddressDocument', maxCount: 1 },
    ]),
  )
  submitKyc(
    @CurrentUser() user: any,
    @Body() dto: SubmitVendorKycDto,
    @UploadedFiles()
    files: {
      governmentIdDocument?: Express.Multer.File[];
      proofOfAddressDocument?: Express.Multer.File[];
    },
  ) {
    const governmentIdDocument = files?.governmentIdDocument?.[0];
    const proofOfAddressDocument = files?.proofOfAddressDocument?.[0];

    if (!governmentIdDocument) {
      throw new BadRequestException('Government ID document is required');
    }

    if (!proofOfAddressDocument) {
      throw new BadRequestException('Proof of address document is required');
    }

    return this.vendorService.submitKyc(
      user._id.toString(),
      dto,
      governmentIdDocument,
      proofOfAddressDocument,
    );
  }

  @Get('me/profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user vendor onboarding profile' })
  getMyVendorProfile(@CurrentUser() user: any) {
    return this.vendorService.getMyVendorProfile(user._id.toString());
  }
}