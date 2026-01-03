import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { LoginResponseDto } from '../../auth/dto/login-response.dto';

@ApiTags('Admin - Auth')
@Controller({
  path: 'admin/auth',
  version: '1',
})
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({
    status: 200,
    description: 'Admin logged in successfully',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Admin role required',
  })
  async login(@Body() adminLoginDto: AdminLoginDto): Promise<LoginResponseDto> {
    return this.adminAuthService.login(adminLoginDto);
  }
}
