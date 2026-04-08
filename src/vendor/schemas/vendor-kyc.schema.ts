import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { GovernmentIdType } from '../enums/government-id-type.enum';
import { VendorStatus } from '../enums/vendor-status.enum';

export type VendorKycDocument = HydratedDocument<VendorKyc>;

@Schema({ timestamps: true })
export class VendorKyc {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: GovernmentIdType,
    required: true,
  })
  governmentIdType!: GovernmentIdType;

  @Prop({ required: true })
  governmentIdDocumentUrl!: string;

  @Prop({ required: true })
  governmentIdDocumentPublicId!: string;

  @Prop({ required: true })
  proofOfAddressDocumentUrl!: string;

  @Prop({ required: true })
  proofOfAddressDocumentPublicId!: string;

  @Prop({ enum: VendorStatus, default: VendorStatus.DRAFT })
  status!: VendorStatus;

  @Prop({ default: '' })
  rejectionReason!: string;
}

export const VendorKycSchema = SchemaFactory.createForClass(VendorKyc);