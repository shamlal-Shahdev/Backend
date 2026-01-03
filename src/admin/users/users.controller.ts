import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminUsersService } from './users.service';
import { FilterUsersDto } from './dto/filter-users.dto';

@ApiTags('Admin - Users')
@Controller({
  path: 'admin/users',
  version: '1',
})
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with filters' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers(@Query() dto: FilterUsersDto) {
    return this.adminUsersService.getUsers(dto);
  }

  @Get(':userId')
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOperation({ summary: 'Get user details' })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetails(@Param('userId', ParseIntPipe) userId: number) {
    return this.adminUsersService.getUserDetails(userId);
  }
}
