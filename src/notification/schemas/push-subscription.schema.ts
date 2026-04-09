import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type PushSubscriptionDocument = HydratedDocument<PushSubscriptionEntity>;

@Schema({ timestamps: true })
export class PushSubscriptionEntity {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  endpoint!: string;

  @Prop({ type: Object, required: true })
  keys!: {
    p256dh: string;
    auth: string;
  };

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const PushSubscriptionSchema =
  SchemaFactory.createForClass(PushSubscriptionEntity);

PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });