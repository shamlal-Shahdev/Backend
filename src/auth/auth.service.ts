import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { User } from '../users/domain/user';
import { JwtPayloadType } from './strategies/types/jwt-payload.type';
import {
  InvalidCredentialsException,
  InvalidTokenException,
  UnverifiedUserException,
  UserExistsException,
  UserNotFoundException,
} from './exceptions/auth.exceptions';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private emailService: EmailService,
    private configService: ConfigService<AllConfigType>,
  ) {}

  async register(registerDto: RegisterDto): Promise<void> {
    try {
      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(registerDto.email);
      if (existingUser) {
        this.logger.warn(`Registration attempt with existing email: ${registerDto.email}`);
        throw new UserExistsException();
      }

      // Hash password
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(registerDto.password, salt);

      // Generate verification token
      const verificationToken = randomStringGenerator();

      // Create user
      const user = await this.usersService.create({
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        name: `${registerDto.firstName} ${registerDto.lastName}`,
        email: registerDto.email,
        password: hashedPassword,
        isVerified: false,
        verificationToken,
        resetToken: null,
      });

      this.logger.log(`User created successfully: ${user.email}`);

      // Send verification email
      await this.emailService.sendVerificationEmail(registerDto.email, verificationToken);
      this.logger.log(`Verification email sent to: ${user.email}`);
    } catch (error) {
      this.logger.error('Error during user registration:', error);
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<{ token: string; user: User }> {
    try {
      // Find user by email
      const user = await this.usersService.findByEmail(loginDto.email);
      if (!user) {
        this.logger.warn(`Login attempt with non-existent email: ${loginDto.email}`);
        throw new InvalidCredentialsException();
      }

      // Check if user is verified
      if (!user.isVerified) {
        this.logger.warn(`Login attempt with unverified email: ${loginDto.email}`);
        throw new UnverifiedUserException();
      } 

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password attempt for user: ${loginDto.email}`);
        throw new InvalidCredentialsException();
      }

      // Generate JWT token
      const payload: JwtPayloadType = { id: user.id, email: user.email };
      const token = await this.generateToken(payload);

      this.logger.log(`User logged in successfully: ${user.email}`);
      return { token, user };
    } catch (error) {
      this.logger.error('Error during login:', error);
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const user = await this.usersService.findByVerificationToken(token);
      if (!user) {
        this.logger.warn(`Invalid verification token attempt: ${token}`);
        throw new InvalidTokenException('verification');
      }

      await this.usersService.update(user.id, {
        isVerified: true,
        verificationToken: null,
      });
      this.logger.log(`Email verified successfully for user: ${user.email}`);
    } catch (error) {
      this.logger.error('Error during email verification:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        this.logger.debug(`Password reset requested for non-existent email: ${email}`);
        return;
      }

      const resetToken = randomStringGenerator();
      await this.usersService.update(user.id, { resetToken });
      await this.emailService.sendResetPasswordEmail(email, resetToken);
      this.logger.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      this.logger.error('Error during forgot password process:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const user = await this.usersService.findByResetToken(token);
      if (!user) {
        this.logger.warn(`Invalid reset token attempt: ${token}`);
        throw new InvalidTokenException('reset');
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await this.usersService.update(user.id, {
        password: hashedPassword,
        resetToken: null,
      });
      this.logger.log(`Password reset successfully for user: ${user.email}`);
    } catch (error) {
      this.logger.error('Error during password reset:', error);
      throw error;
    }
  }

  async me(userJwtPayload: JwtPayloadType): Promise<User> {
    try {
      const user = await this.usersService.findById(userJwtPayload.id);
      if (!user) {
        this.logger.warn(`User not found for ID: ${userJwtPayload.id}`);
        throw new UserNotFoundException();
      }
      return user;
    } catch (error) {
      this.logger.error('Error fetching user profile:', error);
      throw error;
    }
  }

  private async generateToken(payload: JwtPayloadType): Promise<string> {
    try {
      return await this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('auth.secret', { infer: true }),
        expiresIn: this.configService.getOrThrow('auth.expires', { infer: true }),
      });
    } catch (error) {
      this.logger.error('Error generating JWT token:', error);
      throw error;
    }
  }
}
