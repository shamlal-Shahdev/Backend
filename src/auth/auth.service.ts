import { HttpException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterWithKycDto } from '../kyc/dto/register-with-kyc.dto';
import { UsersService } from '../users/users.service';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { EmailService } from '../email/email.service';
import { KycService } from '../kyc/kyc.service';
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
    private kycService: KycService,
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

  async registerWithKyc(
    registerWithKycDto: RegisterWithKycDto,
    files: {
      cnicFront?: Express.Multer.File[];
      cnicBack?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
  ): Promise<void> {
    try {
      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(registerWithKycDto.email);
      if (existingUser) {
        this.logger.warn(`Registration attempt with existing email: ${registerWithKycDto.email}`);
        throw new UserExistsException();
      }

      // Validate files
      if (!files.cnicFront || !files.cnicBack || !files.selfie) {
        throw new Error('All KYC documents are required');
      }

      // Hash password
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(registerWithKycDto.password, salt);

      // Generate verification token
      const verificationToken = randomStringGenerator();

      // Create user
      this.logger.log(`Creating user with phone: ${registerWithKycDto.phone}`);
      const user = await this.usersService.create({
        firstName: registerWithKycDto.firstName,
        lastName: registerWithKycDto.lastName,
        name: `${registerWithKycDto.firstName} ${registerWithKycDto.lastName}`,
        email: registerWithKycDto.email,
        password: hashedPassword,
        phone: registerWithKycDto.phone,
        isVerified: false,
        verificationToken,
        resetToken: null,
      });

      this.logger.log(`User created successfully: ${user.email}, Phone: ${user.phone}`);

      // Create KYC submission
      await this.kycService.createKycSubmission({
        userId: user.id,
        cnicNumber: registerWithKycDto.cnicNumber,
        city: registerWithKycDto.city,
        province: registerWithKycDto.province,
        country: registerWithKycDto.country,
        gender: registerWithKycDto.gender,
        dateOfBirth: new Date(registerWithKycDto.dateOfBirth),
        phone: registerWithKycDto.phone,
        cnicFront: files.cnicFront[0],
        cnicBack: files.cnicBack[0],
        selfie: files.selfie[0],
      });

      this.logger.log(`KYC submission created for user: ${user.email}`);

      // Send verification email
      await this.emailService.sendVerificationEmail(registerWithKycDto.email, verificationToken);
      this.logger.log(`Verification email sent to: ${user.email}`);
    } catch (error) {
      this.logger.error('Error during registration with KYC:', error);
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<{ token: string; user: User }> {
    try {
      // Normalize email to lowercase for consistent lookup
      const normalizedEmail = loginDto.email?.toLowerCase().trim();
      
      if (!normalizedEmail) {
        this.logger.error('❌ Login attempt with empty email');
        throw new UserNotFoundException('Email is required. Please provide a valid email address.');
      }

      this.logger.log(`🔐 Login attempt for email: ${normalizedEmail}`);
      
      // Find user by email - this should return null if user doesn't exist
      const user = await this.usersService.findByEmail(normalizedEmail);
      
      // STRICT CHECK: User must exist
      if (!user || !user.id) {
        this.logger.warn(`❌ Login attempt with non-existent email: ${normalizedEmail}`);
        this.logger.warn(`📊 User lookup returned: ${user === null ? 'null' : 'undefined or invalid user object'}`);
        
        // Throw UserNotFoundException with clear message to register first
        const error = new UserNotFoundException('This email is not registered. Please register first to create an account.');
        this.logger.error(`🚫 Throwing UserNotFoundException with status: ${error.getStatus()}`);
        this.logger.error(`🚫 Exception response:`, JSON.stringify(error.getResponse(), null, 2));
        throw error;
      }

      this.logger.log(`📧 User found - ID: ${user.id}, Email: ${user.email}, Verified: ${user.isVerified}`);

      // Check if user is verified
      if (!user.isVerified) {
        this.logger.warn(`⚠️ Login attempt with unverified email: ${normalizedEmail}`);
        throw new UnverifiedUserException();
      } 

      // Verify password - user.password must exist
      if (!user.password) {
        this.logger.error(`🔒 User ${user.id} has no password set`);
        throw new InvalidCredentialsException();
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`🔒 Invalid password attempt for user: ${normalizedEmail}`);
        throw new InvalidCredentialsException();
      }

      // Generate JWT token only if all checks pass
      const payload: JwtPayloadType = { id: user.id, email: user.email };
      const token = await this.generateToken(payload);

      this.logger.log(`✅ User logged in successfully: ${user.email} (ID: ${user.id})`);
      return { token, user };
    } catch (error) {
      this.logger.error('❌ Error during login:', error);
      this.logger.error(`❌ Error type: ${error?.constructor?.name}`);
      this.logger.error(`❌ Error message: ${error?.message}`);
      
      if (error instanceof HttpException) {
        this.logger.error(`📤 Exception status: ${error.getStatus()}`);
        this.logger.error(`📤 Exception response:`, JSON.stringify(error.getResponse(), null, 2));
      }
      
      // Re-throw the error - don't catch and transform it
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
        this.logger.debug(`Password reset requested for non-existent email: ${email}`);
        throw new UserNotFoundException();
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
      const updatedUser = await this.usersService.update(userId, updateUserDto);
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
        expiresIn: this.configService.getOrThrow('auth.expires', { infer: true }),
      });
    } catch (error) {
      this.logger.error('Error generating JWT token:', error);
      throw error;
    }
  }
}
