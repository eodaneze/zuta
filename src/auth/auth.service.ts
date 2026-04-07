import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    const token = await this.generateToken(user);

    return {
      message: 'User registered successfully',
      data: {
        accessToken: token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          country: user.country,
          role: user.role,
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
        },
      },
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