import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { RoleEnum } from '../roles/roles.enum';
import { MarketplaceItemService } from './marketplace-item.service';
import { CreateMarketplaceItemDto } from './dto/create-marketplace-item.dto';
import { UpdateMarketplaceItemDto } from './dto/update-marketplace-item.dto';
import { MarketplaceItemEntity } from './entity/marketplace-item.entity';
@ApiTags('Marketplace Items')
@Controller({
  path: 'marketplace-items',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class MarketplaceItemController {
  constructor(
    private readonly marketplaceItemService: MarketplaceItemService,
  ) {}
  @Post()
  @ApiOperation({ summary: 'Create a new marketplace item' })
  @ApiResponse({
    status: 201,
    description: 'Marketplace item created successfully',
    type: MarketplaceItemEntity,
  })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createMarketplaceItemDto: CreateMarketplaceItemDto,
  ): Promise<MarketplaceItemEntity> {
    return this.marketplaceItemService.create(createMarketplaceItemDto);
  }
  @Get()
  @ApiOperation({ summary: 'Get all marketplace items with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of marketplace items',
    type: [MarketplaceItemEntity],
  })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.marketplaceItemService.findAll(page, limit);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get a marketplace item by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Marketplace item found',
    type: MarketplaceItemEntity,
  })
  @ApiResponse({ status: 404, description: 'Marketplace item not found' })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MarketplaceItemEntity> {
    return this.marketplaceItemService.findOne(id);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update a marketplace item' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Marketplace item updated successfully',
    type: MarketplaceItemEntity,
  })
  @ApiResponse({ status: 404, description: 'Marketplace item not found' })
  @Roles(RoleEnum.admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMarketplaceItemDto: UpdateMarketplaceItemDto,
  ): Promise<MarketplaceItemEntity> {
    return this.marketplaceItemService.update(id, updateMarketplaceItemDto);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a marketplace item' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 204,
    description: 'Marketplace item deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Marketplace item not found' })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.marketplaceItemService.remove(id);
  }
}
