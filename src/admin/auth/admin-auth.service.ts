import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { UserService } from '../../user/user.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UserEntity, UserRole } from '../../user/entity/user.entity';
import { JwtPayloadType } from '../../auth/strategies/types/jwt-payload.type';
import { AllConfigType } from '../../config/config.type';
import {
  InvalidCredentialsException,
  UnverifiedUserException,
  UserNotFoundException,
} from '../../auth/exceptions/auth.exceptions';
@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);
  constructor(
    private jwtService: JwtService,
    private usersService: UserService,
    private configService: ConfigService<AllConfigType>,
  ) {}
  async login(
    adminLoginDto: AdminLoginDto,
  ): Promise<{ token: string; user: UserEntity }> {
    try {
      this.logger.log(
        `🔐 Admin login attempt for email: ${adminLoginDto.email}`,
      );
      const user = await this.usersService.findByEmail(adminLoginDto.email);
      if (!user || !user.id) {
        this.logger.warn(
          `❌ Admin login attempt with non-existent email: ${adminLoginDto.email}`,
        );
        throw new UserNotFoundException('Invalid credentials');
      }
      this.logger.log(
        `📧 User found - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`,
      );
      if (user.role !== UserRole.ADMIN) {
        this.logger.warn(
          `🚫 Admin login attempt by non-admin user: ${adminLoginDto.email} (Role: ${user.role})`,
        );
        throw new ForbiddenException('Access denied. Admin role required.');
      }
      if (!user.isVerified) {
        this.logger.warn(
          `⚠️ Admin login attempt with unverified email: ${adminLoginDto.email}`,
        );
        throw new UnverifiedUserException();
      }
      if (!user.passwordHash) {
        this.logger.error(`🔒 Admin user ${user.id} has no password set`);
        throw new InvalidCredentialsException();
      }
      const isPasswordValid = await bcrypt.compare(
        adminLoginDto.password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        this.logger.warn(
          `🔒 Invalid password attempt for admin: ${adminLoginDto.email}`,
        );
        throw new InvalidCredentialsException();
      }
      const payload: JwtPayloadType = { id: user.id, email: user.email };
      const token = await this.generateToken(payload);
      this.logger.log(`✅ Admin login successful for: ${adminLoginDto.email}`);
      return {
        token,
        user,
      };
    } catch (error) {
      this.logger.error('Error during admin login:', error);
      throw error;
    }
  }
  private async generateToken(payload: JwtPayloadType): Promise<string> {
    try {
      return await this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('auth.secret', { infer: true }),
        expiresIn: this.configService.getOrThrow('auth.expires', {
          infer: true,
        }),
      });
    } catch (error) {
      this.logger.error('Error generating JWT token:', error);
      throw error;
    }
  }
}
