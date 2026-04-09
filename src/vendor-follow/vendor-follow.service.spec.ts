import { Test, TestingModule } from '@nestjs/testing';
import { VendorFollowService } from './vendor-follow.service';

describe('VendorFollowService', () => {
  let service: VendorFollowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorFollowService],
    }).compile();

    service = module.get<VendorFollowService>(VendorFollowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
