import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from '../user/entity/user.entity';
@ApiTags('Vendors')
@Controller({
  path: 'vendors',
  version: '1',
})
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VendorController {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  @Get()
  @ApiOperation({ summary: 'Get verified vendors list' })
  @ApiQuery({
    name: 'verified',
    required: false,
    type: Boolean,
    description: 'Filter by verified status (default: true)',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'List of verified vendors',
    type: [UserEntity],
  })
  async getVendors(
    @Query(
      'verified',
      new DefaultValuePipe(true),
      ParseBoolPipe,
    )
    verified: boolean,
  ): Promise<{ vendors: UserEntity[]; total: number }> {
    const vendors = await this.userRepository.find({
      where: {
        role: UserRole.VENDOR,
        isVerified: verified,
      },
      select: ['id', 'name', 'email', 'phone', 'companyName', 'isVerified', 'role'],
      order: { name: 'ASC' },
    });
    return {
      vendors,
      total: vendors.length,
    };
  }
}
