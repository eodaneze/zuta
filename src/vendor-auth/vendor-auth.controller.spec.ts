import { Test, TestingModule } from '@nestjs/testing';
import { VendorAuthController } from './vendor-auth.controller';

describe('VendorAuthController', () => {
  let controller: VendorAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorAuthController],
    }).compile();

    controller = module.get<VendorAuthController>(VendorAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
