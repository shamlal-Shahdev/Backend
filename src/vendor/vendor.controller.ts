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

export class VendorListItemDto {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  isVerified: boolean;
  role: UserRole;
}

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
  })
  async getVendors(
    @Query(
      'verified',
      new DefaultValuePipe(true),
      ParseBoolPipe,
    )
    verified: boolean,
  ): Promise<{ vendors: VendorListItemDto[]; total: number }> {
    const vendors = await this.userRepository.find({
      where: {
        role: UserRole.VENDOR,
        isVerified: verified,
      },
      relations: ['vendorCompanyProfile'],
      order: { name: 'ASC' },
    });
    const items: VendorListItemDto[] = vendors.map((v) => ({
      id: v.id,
      name: v.name,
      email: v.email,
      phone: v.phone,
      companyName: v.vendorCompanyProfile?.companyName ?? null,
      isVerified: v.isVerified,
      role: v.role,
    }));
    return {
      vendors: items,
      total: items.length,
    };
  }
}
