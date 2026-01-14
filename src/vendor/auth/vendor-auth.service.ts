import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { UserService } from '../../user/user.service';
import { EmailService } from '../../email/email.service';
import { VendorRegisterDto } from './dto/vendor-register.dto';
import { VendorLoginDto } from './dto/vendor-login.dto';
import { UserEntity, UserRole } from '../../user/entity/user.entity';
import { JwtPayloadType } from '../../auth/strategies/types/jwt-payload.type';
import { AllConfigType } from '../../config/config.type';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import {
  InvalidCredentialsException,
  InvalidTokenException,
  UnverifiedUserException,
  UserExistsException,
  UserNotFoundException,
} from '../../auth/exceptions/auth.exceptions';
import { CreateUserDto } from '../../user/dto/create-user.dto';

@Injectable()
export class VendorAuthService {
  private readonly logger = new Logger(VendorAuthService.name);

  constructor(
    private jwtService: JwtService,
    private usersService: UserService,
    private emailService: EmailService,
    private configService: ConfigService<AllConfigType>,
  ) {}

  async register(vendorRegisterDto: VendorRegisterDto): Promise<void> {
    try {
      this.logger.log(
        `🔐 Vendor registration attempt for email: ${vendorRegisterDto.email}`,
      );

      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(
        vendorRegisterDto.email,
      );
      if (existingUser) {
        this.logger.warn(
          `❌ Vendor registration attempt with existing email: ${vendorRegisterDto.email}`,
        );
        throw new UserExistsException();
      }

      // Hash password
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(
        vendorRegisterDto.password,
        salt,
      );

      // Generate verification token
      const verificationToken = randomStringGenerator();

      // Create vendor user
      const user = await this.usersService.create({
        name:
          vendorRegisterDto.firstName && vendorRegisterDto.lastName
            ? `${vendorRegisterDto.firstName} ${vendorRegisterDto.lastName}`
            : vendorRegisterDto.email.split('@')[0],
        email: vendorRegisterDto.email,
        passwordHash: hashedPassword,
        walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        isVerified: false,
        verificationToken,
        resetToken: null,
        kycStatus: 'not_submitted',
        phone: vendorRegisterDto.phone,
        companyName: vendorRegisterDto.companyName,
        role: UserRole.VENDOR,
      } as CreateUserDto);

      this.logger.log(`✅ Vendor created successfully: ${user.email}`);

      // Send verification email
      await this.emailService.sendVerificationEmail(
        vendorRegisterDto.email,
        verificationToken,
      );
      this.logger.log(`📧 Verification email sent to: ${user.email}`);
    } catch (error) {
      this.logger.error('Error during vendor registration:', error);
      throw error;
    }
  }

  async login(
    vendorLoginDto: VendorLoginDto,
  ): Promise<{ token: string; user: UserEntity }> {
    try {
      this.logger.log(
        `🔐 Vendor login attempt for email: ${vendorLoginDto.email}`,
      );

      // Normalize email to lowercase for consistent lookup
      const normalizedEmail = vendorLoginDto.email?.toLowerCase().trim();

      if (!normalizedEmail) {
        this.logger.error('❌ Vendor login attempt with empty email');
        throw new UserNotFoundException(
          'Email is required. Please provide a valid email address.',
        );
      }

      // Find user by email
      const user = await this.usersService.findByEmail(normalizedEmail);

      // Check if user exists
      if (!user || !user.id) {
        this.logger.warn(
          `❌ Vendor login attempt with non-existent email: ${normalizedEmail}`,
        );
        throw new UserNotFoundException(
          'This email is not registered. Please register first to create a vendor account.',
        );
      }

      this.logger.log(
        `📧 User found - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`,
      );

      // Check if user is vendor
      if (user.role !== UserRole.VENDOR) {
        this.logger.warn(
          `🚫 Vendor login attempt by non-vendor user: ${vendorLoginDto.email} (Role: ${user.role})`,
        );
        throw new ForbiddenException(
          'Access denied. Vendor role required.',
        );
      }

      // Check if user is verified
      if (!user.isVerified) {
        this.logger.warn(
          `⚠️ Vendor login attempt with unverified email: ${vendorLoginDto.email}`,
        );
        throw new UnverifiedUserException();
      }

      // Verify password
      if (!user.passwordHash) {
        this.logger.error(`🔒 Vendor user ${user.id} has no password set`);
        throw new InvalidCredentialsException();
      }

      const isPasswordValid = await bcrypt.compare(
        vendorLoginDto.password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        this.logger.warn(
          `🔒 Invalid password attempt for vendor: ${vendorLoginDto.email}`,
        );
        throw new InvalidCredentialsException();
      }

      // Generate JWT token
      const payload: JwtPayloadType = { id: user.id, email: user.email };
      const token = await this.generateToken(payload);

      this.logger.log(
        `✅ Vendor login successful for: ${vendorLoginDto.email}`,
      );

      return {
        token,
        user,
      };
    } catch (error) {
      this.logger.error('Error during vendor login:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      this.logger.log(`🔐 Vendor forgot password request for email: ${email}`);

      const user = await this.usersService.findByEmail(email);
      
      if (!user) {
        this.logger.warn(
          `Password reset requested for non-existent vendor email: ${email}`,
        );
        throw new UserNotFoundException();
      }

      // Verify user is a vendor
      if (user.role !== UserRole.VENDOR) {
        this.logger.warn(
          `Password reset requested for non-vendor email: ${email}`,
        );
        throw new ForbiddenException('This email is not registered as a vendor');
      }

      const resetToken = randomStringGenerator();
      await this.usersService.update(user.id, {
        resetToken: resetToken as any,
      });
      await this.emailService.sendResetPasswordEmail(email, resetToken);
      this.logger.log(`Password reset email sent to vendor: ${email}`);
    } catch (error) {
      this.logger.error('Error during vendor forgot password process:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      this.logger.log(`🔐 Vendor password reset attempt with token`);

      const user = await this.usersService.findByResetToken(token);
      if (!user) {
        this.logger.warn(`Invalid reset token attempt: ${token}`);
        throw new InvalidTokenException('reset');
      }

      // Verify user is a vendor
      if (user.role !== UserRole.VENDOR) {
        this.logger.warn(
          `Password reset attempt for non-vendor user with token: ${token}`,
        );
        throw new InvalidTokenException('reset');
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await this.usersService.update(user.id, {
        passwordHash: hashedPassword,
        password: hashedPassword, // Alias
        resetToken: null,
      } as any);
      this.logger.log(`Password reset successfully for vendor: ${user.email}`);
    } catch (error) {
      this.logger.error('Error during vendor password reset:', error);
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

