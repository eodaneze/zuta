import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';

interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  roles?: UserRole[];
  isVendor?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(payload: CreateUserInput) {
    const existingUser = await this.userModel.findOne({
      email: payload.email.toLowerCase(),
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    return this.userModel.create({
      ...payload,
      email: payload.email.toLowerCase(),
    });
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async markEmailAsVerified(userId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { isEmailVerified: true },
      { new: true },
    );
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true },
    );
  }

  async addVendorRole(userId: string) {
  return this.userModel.findByIdAndUpdate(
    userId,
    {
      $set: { isVendor: true },
      $addToSet: { role: 'vendor' },
    },
    { new: true },
  );
}

  async markVendorOnboardingComplete(userId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { hasCompletedVendorOnboarding: true },
      { new: true },
    );
  }
}