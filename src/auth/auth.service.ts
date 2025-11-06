import {
  HttpStatus,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
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
import { first } from 'rxjs';

@Injectable()
export class AuthService {
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
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'Email already exists',
        },
      });
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
      name: registerDto.firstName + ' ' + registerDto.lastName,
      email: registerDto.email,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      resetToken: null,
    });

    console.log('Created User:', user);

    // Send verification email
    await this.emailService.sendVerificationEmail(registerDto.email, verificationToken);
      
    } catch (error) {
      console.log('Error during user registration:', error);
      throw error;
      
    }
   
  }

  async login(loginDto: LoginDto): Promise<{ token: string; user: User }> {
    // Find user by email
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'Invalid email or password',
        },
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Please verify your email before logging in',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          password: 'Invalid email or password',
        },
      });
    }

    // Generate JWT token
    const payload: JwtPayloadType = {
      id: user.id,
      email: user.email,
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow('auth.secret', { infer: true }),
      expiresIn: this.configService.getOrThrow('auth.expires', { infer: true }),
    });

    return {
      token,
      user,
    };
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          token: 'Invalid verification token',
        },
      });
    }

    // Update user as verified
    await this.usersService.update(user.id, {
      isVerified: true,
      verificationToken: null,
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return;
    }

    // Generate reset token
    const resetToken = randomStringGenerator();

    // Update user with reset token
    await this.usersService.update(user.id, {
      resetToken,
    });

    // Send reset password email
    await this.emailService.sendResetPasswordEmail(email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findByResetToken(token);
    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          token: 'Invalid reset token',
        },
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user with new password and clear reset token
    await this.usersService.update(user.id, {
      password: hashedPassword,
      resetToken: null,
    });
  }

  async me(userJwtPayload: JwtPayloadType): Promise<User> {
    const user = await this.usersService.findById(userJwtPayload.id);
    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'User not found',
        },
      });
    }
    return user;
  }
}
