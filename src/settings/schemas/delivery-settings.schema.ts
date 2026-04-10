import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DeliverySettingsDocument = HydratedDocument<DeliverySettings>;

@Schema({ timestamps: true })
export class DeliverySettings {
  @Prop({ required: true, default: 0, min: 0 })
  shippingFee!: number;

  @Prop({ required: true, default: 0, min: 0 })
  homeDeliveryFee!: number;
}

export const DeliverySettingsSchema =
  SchemaFactory.createForClass(DeliverySettings);