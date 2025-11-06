import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthGuard } from '@nestjs/passport';
import { LoginResponseDto } from './dto/login-response.dto';
import { User } from '../users/domain/user';

@ApiTags('Auth')
@Controller({
  path: 'auth',
})
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ description: 'User registered successfully' })
  async register(@Body() registerDto: RegisterDto): Promise<{ message: string }> {
    console.log('Register DTO:', registerDto);
    await this.service.register(registerDto);
    return { message: 'Registration successful. Please check your email for verification.' };
  }

  @Post('login')  
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: LoginResponseDto,
  })
  public login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.service.login(loginDto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Email verified successfully' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    await this.service.verifyEmail(verifyEmailDto.token);
    return { message: 'Email verified successfully' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Password reset email sent' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.service.forgotPassword(forgotPasswordDto.email);
    return { message: 'Password reset email sent. Please check your email.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Password reset successfully' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.service.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
    return { message: 'Password reset successfully' };
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({
    type: User,
  })
  @HttpCode(HttpStatus.OK)
  public me(@Request() request): Promise<User> {
    return this.service.me(request.user);
  }
}
