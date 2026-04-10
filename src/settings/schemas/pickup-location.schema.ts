import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PickupLocationDocument = HydratedDocument<PickupLocation>;

@Schema({ timestamps: true })
export class PickupLocation {

  @Prop({required: true, trim: true, unique: true})
  contactPerson!: string;

  @Prop({required: true, trim: true, unique: true})
  phone!: string;

  @Prop({ required: true, trim: true, unique: true })
  name!: string;

  @Prop({ required: true, trim: true })
  address!: string;

  @Prop({ default: '', trim: true })
  city!: string;

  @Prop({ default: '', trim: true })
  state!: string;

  @Prop({ default: '', trim: true })
  country!: string;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const PickupLocationSchema =
  SchemaFactory.createForClass(PickupLocation);