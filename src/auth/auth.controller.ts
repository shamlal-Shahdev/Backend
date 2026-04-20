import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  Query,
  Request,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { LoginResponseDto } from './dto/login-response.dto';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { Throttle } from '@nestjs/throttler';
import { UpdateUserDto } from '../user/dto/update-user.dto';
@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly service: AuthService) {}
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) 
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ description: 'User registered successfully' })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ message: string }> {
    await this.service.register(registerDto);
    return {
      message:
        'Registration successful. Please check your email for verification.',
    };
  }
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) 
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ groups: ['me'] })
  @ApiOkResponse({
    type: LoginResponseDto,
  })
  public login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.service.login(loginDto);
  }
  @Get('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Email verified successfully' })
  async verifyEmail(
    @Query('token') token: string,
  ): Promise<{ message: string; redirectUrl: string; role: string }> {
    if (!token) {
      throw new Error('Verification token is required');
    }
    const { role } = await this.service.verifyEmail(token);
    const redirectUrl = role === 'vendor' ? '/vendor/login' : '/';
    return {
      message: 'Email verified successfully',
      redirectUrl,
      role,
    };
  }
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) 
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Password reset email sent' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.service.forgotPassword(forgotPasswordDto.email);
    return { message: 'Password reset email sent. Please check your email.' };
  }
  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) 
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Password reset successfully' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.service.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    return { message: 'Password reset successfully' };
  }
  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) 
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Verification email resent successfully' })
  async resendVerificationEmail(
    @Body() body: { email: string },
  ): Promise<{ message: string }> {
    await this.service.resendVerificationEmail(body.email);
    return { message: 'Verification email sent. Please check your inbox.' };
  }
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ groups: ['me'] })
  @ApiOkResponse({
    description: 'Current user profile',
    type: AuthUserResponseDto,
  })
  async getCurrentUser(@Request() req): Promise<AuthUserResponseDto> {
    const user = req.user as { id: number; email: string };
    return this.service.me({ id: user.id, email: user.email });
  }
  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ groups: ['me'] })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    type: AuthUserResponseDto,
  })
  async updateProfile(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<AuthUserResponseDto> {
    const user = req.user as { id: number };
    return this.service.updateMe(user.id.toString(), updateUserDto);
  }
}
