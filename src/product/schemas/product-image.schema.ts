import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: true })
export class ProductImage {
  @Prop({ required: true })
  url!: string;

  @Prop({ required: true })
  publicId!: string;
}

export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);