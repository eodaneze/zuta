import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ProductImage, ProductImageSchema } from './product-image.schema';

@Schema({ _id: true })
export class ProductVariant {
  @Prop({ trim: true, default: '' })
  size!: string;

  @Prop({ trim: true, default: '' })
  color!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, min: 0 })
  quantity!: number;

  @Prop({ type: ProductImageSchema, default: null })
  image?: ProductImage | null;
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);