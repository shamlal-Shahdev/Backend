import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VendorAuthService } from './vendor-auth.service';
import { VendorRegisterDto } from './dto/vendor-register.dto';
import { VendorLoginDto } from './dto/vendor-login.dto';
import { ForgotPasswordDto } from '../../auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '../../auth/dto/reset-password.dto';
import { LoginResponseDto } from '../../auth/dto/login-response.dto';
import { Throttle } from '@nestjs/throttler';
@ApiTags('Vendor - Auth')
@Controller({
  path: 'vendor/auth',
  version: '1',
})
export class VendorAuthController {
  constructor(private readonly vendorAuthService: VendorAuthService) {}
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) 
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Vendor registration' })
  @ApiResponse({
    status: 201,
    description: 'Vendor registered successfully. Verification email sent.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() vendorRegisterDto: VendorRegisterDto): Promise<{
    message: string;
  }> {
    await this.vendorAuthService.register(vendorRegisterDto);
    return {
      message:
        'Vendor registration successful. Please check your email for verification.',
    };
  }
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) 
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vendor login' })
  @ApiResponse({
    status: 200,
    description: 'Vendor logged in successfully',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Vendor role required',
  })
  async login(@Body() vendorLoginDto: VendorLoginDto): Promise<LoginResponseDto> {
    return this.vendorAuthService.login(vendorLoginDto);
  }
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) 
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vendor forgot password' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.vendorAuthService.forgotPassword(forgotPasswordDto.email);
    return { message: 'Password reset email sent. Please check your email.' };
  }
  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) 
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vendor reset password' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.vendorAuthService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    return { message: 'Password reset successfully' };
  }
  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) 
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend vendor verification email' })
  @ApiResponse({ status: 200, description: 'Verification email resent successfully' })
  async resendVerificationEmail(
    @Body() body: { email: string },
  ): Promise<{ message: string }> {
    await this.vendorAuthService.resendVerificationEmail(body.email);
    return { message: 'Verification email sent. Please check your inbox.' };
  }
}
