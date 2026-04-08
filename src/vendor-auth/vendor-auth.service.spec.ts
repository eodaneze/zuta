import { Test, TestingModule } from '@nestjs/testing';
import { VendorAuthService } from './vendor-auth.service';

describe('VendorAuthService', () => {
  let service: VendorAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorAuthService],
    }).compile();

    service = module.get<VendorAuthService>(VendorAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
