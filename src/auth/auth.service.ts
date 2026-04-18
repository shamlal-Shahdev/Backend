import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserService } from '../user/user.service';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { UserEntity as User, UserRole } from '../user/entity/user.entity';
import { JwtPayloadType } from './strategies/types/jwt-payload.type';
import {
  InvalidCredentialsException,
  InvalidTokenException,
  UnverifiedUserException,
  UserExistsException,
  UserNotFoundException,
} from './exceptions/auth.exceptions';
import { CreateUserDto } from '../user/dto/create-user.dto';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private jwtService: JwtService,
    private usersService: UserService,
    private emailService: EmailService,
    private configService: ConfigService<AllConfigType>,
  ) {}
  async register(registerDto: RegisterDto): Promise<void> {
    try {
      const existingUser = await this.usersService.findByEmail(
        registerDto.email,
      );
      if (existingUser) {
        this.logger.warn(
          `Registration attempt with existing email: ${registerDto.email}`,
        );
        throw new UserExistsException();
      }
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(registerDto.password, salt);
      const verificationToken = randomStringGenerator();
      const user = await this.usersService.create({
        name:
          registerDto.firstName && registerDto.lastName
            ? `${registerDto.firstName} ${registerDto.lastName}`
            : registerDto.email.split('@')[0],
        email: registerDto.email,
        passwordHash: hashedPassword,
        walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`, 
        isVerified: false,
        verificationToken,
        resetToken: null,
        kycStatus: 'not_submitted',
        phone: registerDto.phone,
        role: UserRole.USER,
      } as CreateUserDto);
      this.logger.log(`User created successfully: ${user.email}`);
      await this.emailService.sendVerificationEmail(
        registerDto.email,
        verificationToken,
      );
      this.logger.log(`Verification email sent to: ${user.email}`);
    } catch (error) {
      this.logger.error('Error during user registration:', error);
      throw error;
    }
  }
  async login(loginDto: LoginDto): Promise<{ token: string; user: any }> {
    try {
      const normalizedEmail = loginDto.email?.toLowerCase().trim();
      if (!normalizedEmail) {
        this.logger.error('❌ Login attempt with empty email');
        throw new UserNotFoundException(
          'Email is required. Please provide a valid email address.',
        );
      }
      this.logger.log(`🔐 Login attempt for email: ${normalizedEmail}`);
      const user = await this.usersService.findByEmail(normalizedEmail);
      if (!user || !user.id) {
        this.logger.warn(
          `❌ Login attempt with non-existent email: ${normalizedEmail}`,
        );
        this.logger.warn(
          `📊 User lookup returned: ${user === null ? 'null' : 'undefined or invalid user object'}`,
        );
        const error = new UserNotFoundException(
          'This email is not registered. Please register first to create an account.',
        );
        this.logger.error(
          `🚫 Throwing UserNotFoundException with status: ${error.getStatus()}`,
        );
        this.logger.error(
          `🚫 Exception response:`,
          JSON.stringify(error.getResponse(), null, 2),
        );
        throw error;
      }
      this.logger.log(
        `📧 User found - ID: ${user.id}, Email: ${user.email}, Verified: ${user.isVerified}`,
      );
      if (!user.isVerified) {
        this.logger.warn(
          `⚠️ Login attempt with unverified email: ${normalizedEmail}`,
        );
        throw new UnverifiedUserException();
      }
      if (!user.passwordHash) {
        this.logger.error(`🔒 User ${user.id} has no password set`);
        throw new InvalidCredentialsException();
      }
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        this.logger.warn(
          `🔒 Invalid password attempt for user: ${normalizedEmail}`,
        );
        throw new InvalidCredentialsException();
      }
      if (user.role === UserRole.ADMIN) {
        this.logger.warn(
          `🚫 Admin login attempt through user endpoint: ${normalizedEmail}`,
        );
        throw new ForbiddenException(
          'Admin users must use the admin login endpoint. Please use the admin login page.',
        );
      }
      const payload: JwtPayloadType = { id: user.id, email: user.email };
      const token = await this.generateToken(payload);
      this.logger.log(
        `✅ User logged in successfully: ${user.email} (ID: ${user.id})`,
      );
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        walletAddress: user.walletAddress,
        phone: user.phone,
        companyName: user.companyName,
        role: user.role,
        isVerified: user.isVerified,
        kycStatus: user.kycStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
      return { token, user: userResponse }; 
    } catch (error) {
      this.logger.error('❌ Error during login:', error);
      this.logger.error(`❌ Error type: ${error?.constructor?.name}`);
      this.logger.error(`❌ Error message: ${error?.message}`);
      if (error instanceof HttpException) {
        this.logger.error(`📤 Exception status: ${error.getStatus()}`);
        this.logger.error(
          `📤 Exception response:`,
          JSON.stringify(error.getResponse(), null, 2),
        );
      }
      throw error;
    }
  }
  async verifyEmail(token: string): Promise<{ role: string }> {
    try {
      console.log('Verification Token:', token);
      const user = await this.usersService.findByVerificationToken(token);
      if (!user) {
        this.logger.warn(`Invalid verification token attempt: ${token}`);
        throw new InvalidTokenException('verification');
      }
      await this.usersService.update(user.id, {
        isVerified: true,
        verificationToken: null as any,
      });
      this.logger.log(`Email verified successfully for user: ${user.email}`);
      return { role: user.role };
    } catch (error) {
      this.logger.error('Error during email verification:', error);
      throw error;
    }
  }
  async forgotPassword(email: string): Promise<void> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        this.logger.warn(
          `Password reset requested for non-existent email: ${email}`,
        );
        throw new UserNotFoundException();
      }
      const resetToken = randomStringGenerator();
      await this.usersService.update(user.id, {
        resetToken: resetToken as any,
      });
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
        passwordHash: hashedPassword,
        password: hashedPassword, 
        resetToken: null,
      } as any);
      this.logger.log(`Password reset successfully for user: ${user.email}`);
    } catch (error) {
      this.logger.error('Error during password reset:', error);
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
      const user = await this.usersService.findByEmail(normalizedEmail);
      if (!user) {
        this.logger.warn(
          `Resend verification attempt for non-existent email: ${normalizedEmail}`,
        );
        throw new UserNotFoundException('User not found with this email address.');
      }
      if (user.isVerified) {
        this.logger.warn(
          `Resend verification attempt for already verified user: ${normalizedEmail}`,
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
      this.logger.log(`Verification email resent to: ${normalizedEmail}`);
    } catch (error) {
      this.logger.error('Error during resend verification email:', error);
      throw error;
    }
  }
  async me(userJwtPayload: JwtPayloadType): Promise<User> {
    try {
      const userId =
        typeof userJwtPayload.id === 'string'
          ? parseInt(userJwtPayload.id, 10)
          : userJwtPayload.id;
      const user = await this.usersService.findById(userId);
      if (!user) {
        this.logger.warn(`User not found for ID: ${userJwtPayload.id}`);
        throw new UserNotFoundException();
      }
      this.logger.log(`📧 User profile fetched:`, {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        hasPhone: !!user.phone,
      });
      return user;
    } catch (error) {
      this.logger.error('Error fetching user profile:', error);
      throw error;
    }
  }
  async updateMe(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        throw new Error('Invalid user ID');
      }
      const updatedUser = await this.usersService.update(
        userIdNum,
        updateUserDto,
      );
      if (!updatedUser) {
        this.logger.warn(`User not found for update: ${userId}`);
        throw new UserNotFoundException();
      }
      this.logger.log(`User profile updated successfully: ${userId}`);
      return updatedUser;
    } catch (error) {
      this.logger.error('Error updating user profile:', error);
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
