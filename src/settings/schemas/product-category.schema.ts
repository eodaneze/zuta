import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductCategoryDocument = HydratedDocument<ProductCategory>;

@Schema({ timestamps: true })
export class ProductCategory {
  @Prop({ required: true, trim: true, unique: true, index: true })
  name!: string;

  @Prop({ default: '', trim: true })
  description!: string;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const ProductCategorySchema =
  SchemaFactory.createForClass(ProductCategory);