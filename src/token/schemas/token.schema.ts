import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TokenType } from '../../common/enums/token-type.enum';
import { User } from '../../users/schemas/user.schema';

export type TokenDocument = HydratedDocument<Token>;

@Schema({ timestamps: true })
export class Token {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  token!: string;

  @Prop({
    type: String,
    enum: TokenType,
    required: true,
  })
  type!: TokenType;

  @Prop({ required: true })
  expiresAt!: Date;
}

export const TokenSchema = SchemaFactory.createForClass(Token);