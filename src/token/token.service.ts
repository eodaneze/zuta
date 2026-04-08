import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Token, TokenDocument } from './schemas/token.schema';
import { TokenType } from '../common/enums/token-type.enum';
import { compareToken, hashToken } from '../common/utils/token.utils';

@Injectable()
export class TokenService {
  constructor(
    @InjectModel(Token.name)
    private readonly tokenModel: Model<TokenDocument>,
  ) {}

  async createToken(params: {
    userId: string;
    token: string;
    type: TokenType;
    expiresInMinutes: number;
  }) {
    const { userId, token, type, expiresInMinutes } = params;

    await this.tokenModel.deleteMany({
      userId: new Types.ObjectId(userId),
      type,
    });

    const hashedToken = await hashToken(token);

    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    return this.tokenModel.create({
      userId: new Types.ObjectId(userId),
      token: hashedToken,
      type,
      expiresAt,
    });
  }

  async verifyToken(params: {
    userId: string;
    token: string;
    type: TokenType;
  }) {
    const { userId, token, type } = params;

    const existingToken = await this.tokenModel.findOne({
      userId: new Types.ObjectId(userId),
      type,
    });

    if (!existingToken) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (existingToken.expiresAt.getTime() < Date.now()) {
      await this.tokenModel.deleteOne({ _id: existingToken._id });
      throw new UnauthorizedException('Token has expired');
    }

    const isValid = await compareToken(token, existingToken.token);

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return existingToken;
  }

  async deleteToken(params: { userId: string; type: TokenType }) {
    const { userId, type } = params;

    return this.tokenModel.deleteMany({
      userId: new Types.ObjectId(userId),
      type,
    });
  }
}