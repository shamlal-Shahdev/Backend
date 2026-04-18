import { Injectable, Logger, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
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
      const existingUser = await this.usersService.findByEmail(
        vendorRegisterDto.email,
      );
      if (existingUser) {
        this.logger.warn(
          `❌ Vendor registration attempt with existing email: ${vendorRegisterDto.email}`,
        );
        throw new UserExistsException();
      }
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(
        vendorRegisterDto.password,
        salt,
      );
      const verificationToken = randomStringGenerator();
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
      const normalizedEmail = vendorLoginDto.email?.toLowerCase().trim();
      if (!normalizedEmail) {
        this.logger.error('❌ Vendor login attempt with empty email');
        throw new UserNotFoundException(
          'Email is required. Please provide a valid email address.',
        );
      }
      const user = await this.usersService.findByEmail(normalizedEmail);
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
      if (user.role !== UserRole.VENDOR) {
        this.logger.warn(
          `🚫 Vendor login attempt by non-vendor user: ${vendorLoginDto.email} (Role: ${user.role})`,
        );
        throw new ForbiddenException(
          'Access denied. Vendor role required.',
        );
      }
      if (!user.isVerified) {
        this.logger.warn(
          `⚠️ Vendor login attempt with unverified email: ${vendorLoginDto.email}`,
        );
        throw new UnverifiedUserException();
      }
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
      await this.emailService.sendResetPasswordEmail(email, resetToken, '/vendor/reset-password');
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
        password: hashedPassword, 
        resetToken: null,
      } as any);
      this.logger.log(`Password reset successfully for vendor: ${user.email}`);
    } catch (error) {
      this.logger.error('Error during vendor password reset:', error);
      throw error;
    }
  }
  async resendVerificationEmail(email: string): Promise<void> {
    try {
      const normalizedEmail = email?.toLowerCase().trim();
      if (!normalizedEmail) {
        this.logger.error('Resend verification attempt with empty email');
        throw new UserNotFoundException('Email is required.');
      }
      this.logger.log(`🔐 Vendor resend verification request for email: ${normalizedEmail}`);
      const user = await this.usersService.findByEmail(normalizedEmail);
      if (!user) {
        this.logger.warn(
          `Resend verification attempt for non-existent vendor email: ${normalizedEmail}`,
        );
        throw new UserNotFoundException('Vendor not found with this email address.');
      }
      if (user.role !== UserRole.VENDOR) {
        this.logger.warn(
          `Resend verification attempt for non-vendor email: ${normalizedEmail}`,
        );
        throw new ForbiddenException('This email is not registered as a vendor');
      }
      if (user.isVerified) {
        this.logger.warn(
          `Resend verification attempt for already verified vendor: ${normalizedEmail}`,
        );
        throw new HttpException(
          'This email is already verified. Please login to continue.',
          HttpStatus.BAD_REQUEST,
        );
      }
      let verificationToken = user.verificationToken;
      if (!verificationToken) {
        verificationToken = randomStringGenerator();
        await this.usersService.update(user.id, {
          verificationToken: verificationToken as any,
        });
      }
      await this.emailService.sendVerificationEmail(
        normalizedEmail,
        verificationToken,
      );
      this.logger.log(`📧 Verification email resent to vendor: ${normalizedEmail}`);
    } catch (error) {
      this.logger.error('Error during vendor resend verification email:', error);
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
