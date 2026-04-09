import { Test, TestingModule } from '@nestjs/testing';
import { VendorFollowController } from './vendor-follow.controller';

describe('VendorFollowController', () => {
  let controller: VendorFollowController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorFollowController],
    }).compile();

    controller = module.get<VendorFollowController>(VendorFollowController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
