import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ default: '', trim: true })
  phone!: string;

  @Prop({ default: '' })
  country!: string;

  @Prop({ type: [String], enum: UserRole, default: [UserRole.CUSTOMER] })
  roles!: UserRole[];

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({default:false})
  isVendor!: boolean;

  @Prop({default: false})
  hasCompletedVendorOnboarding!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);