import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VendorAuthService } from './vendor-auth.service';
import { VendorRegisterDto } from './dto/vendor-register.dto';
import { VendorLoginDto } from './dto/vendor-login.dto';

@ApiTags('Vendor Auth')
@Controller('vendor-auth')
export class VendorAuthController {
  constructor(private readonly vendorAuthService: VendorAuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register directly as a vendor' })
  register(@Body() dto: VendorRegisterDto) {
    return this.vendorAuthService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login directly as a vendor' })
  login(@Body() dto: VendorLoginDto) {
    return this.vendorAuthService.login(dto.email, dto.password);
  }
}