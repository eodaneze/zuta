import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { VendorStatus } from '../enums/vendor-status.enum';

export type VendorProfileDocument = HydratedDocument<VendorProfile>;

@Schema({ timestamps: true })
export class VendorProfile {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  storeName!: string;

  @Prop({ required: true, trim: true })
  storeDescription!: string;

  @Prop({ required: true, trim: true })
  storeCategory!: string;

  @Prop({ required: true })
  storeLogoUrl!: string;

  @Prop({ required: true })
  storeLogoPublicId!: string;

  @Prop({ required: true })
  storeBannerUrl!: string;

  @Prop({ required: true })
  storeBannerPublicId!: string;

  @Prop({ enum: VendorStatus, default: VendorStatus.DRAFT })
  onboardingStatus!: VendorStatus;

  @Prop({ default: '' })
  rejectionReason!: string;
}

export const VendorProfileSchema = SchemaFactory.createForClass(VendorProfile);