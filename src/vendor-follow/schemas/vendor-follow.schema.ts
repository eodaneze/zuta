import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { VendorProfile } from '../../vendor/schemas/vendor-profile.schema';

export type VendorFollowDocument = HydratedDocument<VendorFollow>;

@Schema({ timestamps: true })
export class VendorFollow {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  followerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  vendorId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: VendorProfile.name,
    required: true,
    index: true,
  })
  vendorProfileId!: Types.ObjectId;
}

export const VendorFollowSchema = SchemaFactory.createForClass(VendorFollow);

VendorFollowSchema.index({ followerId: 1, vendorId: 1 }, { unique: true });
VendorFollowSchema.index({ vendorId: 1, createdAt: -1 });
VendorFollowSchema.index({ vendorProfileId: 1, createdAt: -1 });