import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
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
import { UserEntity as User } from '../user/entity/user.entity';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ description: 'User registered successfully' })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ message: string }> {
    console.log('Register DTO:', registerDto);
    await this.service.register(registerDto);
    return {
      message:
        'Registration successful. Please check your email for verification.',
    };
  }

  @Post('login')
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
  ): Promise<{ message: string; redirectUrl: string }> {
    if (!token) {
      throw new Error('Verification token is required');
    }
    console.log('Verification Token:', token);
    await this.service.verifyEmail(token);
    return {
      message: 'Email verified successfully',
      redirectUrl: '/', // This points to the login page as per your frontend routes
    };
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
    await this.service.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    return { message: 'Password reset successfully' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ groups: ['me'] })
  @ApiOkResponse({
    description: 'Current user profile',
    type: User,
  })
  async getCurrentUser(@Request() req): Promise<User> {
    // Since JWT strategy now returns UserEntity, request.user is already the user
    // But we'll use the service method to ensure we get the latest data from database
    const user = req.user as User;
    return this.service.me({ id: user.id, email: user.email });
  }
}
