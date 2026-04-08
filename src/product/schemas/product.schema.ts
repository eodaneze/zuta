import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { VendorProfile } from '../../vendor/schemas/vendor-profile.schema';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductImage, ProductImageSchema } from './product-image.schema';
import { ProductVariant, ProductVariantSchema } from './product-variant.schema';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  vendorId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: VendorProfile.name,
    required: true,
    index: true,
  })
  vendorProfileId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: '', trim: true })
  description!: string;

  @Prop({ required: true, trim: true })
  category!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [ProductImageSchema], default: [] })
  images!: ProductImage[];

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ type: Number, default: null, min: 0 })
  discountPrice?: number | null;

  @Prop({ required: true, min: 0 })
  quantity!: number;

  @Prop({ required: true, unique: true, index: true, trim: true })
  sku!: string;

  @Prop({ default: false })
  hasVariants!: boolean;

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants!: ProductVariant[];

  @Prop({
    type: String,
    enum: Object.values(ProductStatus),
    default: ProductStatus.PENDING,
  })
  status!: ProductStatus;

  @Prop({ default: '' })
  rejectionReason!: string;

  @Prop({ default: false })
  isDeleted!: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ vendorId: 1, createdAt: -1 });
ProductSchema.index({ vendorProfileId: 1, createdAt: -1 });
ProductSchema.index({ category: 1, status: 1 });