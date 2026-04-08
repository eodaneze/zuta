import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { TokenService } from '../token/token.service';
import { TokenType } from '../common/enums/token-type.enum';
import { generateFourDigitCode } from '../common/utils/code.utils';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    const code = generateFourDigitCode();

    await this.tokenService.createToken({
      userId: user._id.toString(),
      token: code,
      type: TokenType.EMAIL_VERIFICATION,
      expiresInMinutes: Number(
        this.configService.get<string>(
          'EMAIL_VERIFICATION_TOKEN_EXPIRES_MINUTES',
        ) || 10,
      ),
    });

    await this.mailService.sendVerificationEmail(user.email, {
      name: user.fullName,
      code,
    });

    const token = await this.generateToken(user);

    return {
      message:
        'User registered successfully. A verification code has been sent to your email',
      data: {
        accessToken: token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          country: user.country,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.generateToken(user);

    return {
      message: 'Login successful',
      data: {
        accessToken: token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          country: user.country,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      },
    };
  }

  async requestEmailVerification(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const code = generateFourDigitCode();

    await this.tokenService.createToken({
      userId: user._id.toString(),
      token: code,
      type: TokenType.EMAIL_VERIFICATION,
      expiresInMinutes: Number(
        this.configService.get<string>(
          'EMAIL_VERIFICATION_TOKEN_EXPIRES_MINUTES',
        ) || 10,
      ),
    });

    await this.mailService.sendVerificationEmail(user.email, {
      name: user.fullName,
      code,
    });

    return {
      message: 'Verification code sent successfully',
    };
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.tokenService.verifyToken({
      userId: user._id.toString(),
      token: code,
      type: TokenType.EMAIL_VERIFICATION,
    });

    await this.usersService.markEmailAsVerified(user._id.toString());

    await this.tokenService.deleteToken({
      userId: user._id.toString(),
      type: TokenType.EMAIL_VERIFICATION,
    });

    return {
      message: 'Email verified successfully',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const code = generateFourDigitCode();

    await this.tokenService.createToken({
      userId: user._id.toString(),
      token: code,
      type: TokenType.PASSWORD_RESET,
      expiresInMinutes: Number(
        this.configService.get<string>(
          'PASSWORD_RESET_TOKEN_EXPIRES_MINUTES',
        ) || 10,
      ),
    });

    await this.mailService.sendResetPasswordEmail(user.email, {
      name: user.fullName,
      code,
    });

    return {
      message: 'Password reset code sent successfully',
    };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.tokenService.verifyToken({
      userId: user._id.toString(),
      token: code,
      type: TokenType.PASSWORD_RESET,
    });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersService.updatePassword(user._id.toString(), hashedPassword);

    await this.tokenService.deleteToken({
      userId: user._id.toString(),
      type: TokenType.PASSWORD_RESET,
    });

    return {
      message: 'Password reset successful',
    };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }

  private async generateToken(user: any) {
    return this.jwtService.signAsync({
      sub: user._id,
      email: user.email,
      role: user.role,
    });
  }
}