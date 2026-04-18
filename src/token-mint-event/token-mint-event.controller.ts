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
import { TokenMintEventService } from './token-mint-event.service';
import { CreateTokenMintEventDto } from './dto/create-token-mint-event.dto';
import { UpdateTokenMintEventDto } from './dto/update-token-mint-event.dto';
import { TokenMintEventEntity } from './entity/token-mint-event.entity';
@ApiTags('Token Mint Events')
@Controller({
  path: 'token-mint-events',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class TokenMintEventController {
  constructor(private readonly tokenMintEventService: TokenMintEventService) {}
  @Post()
  @ApiOperation({ summary: 'Create a new token mint event' })
  @ApiResponse({
    status: 201,
    description: 'Token mint event created successfully',
    type: TokenMintEventEntity,
  })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createTokenMintEventDto: CreateTokenMintEventDto,
  ): Promise<TokenMintEventEntity> {
    return this.tokenMintEventService.create(createTokenMintEventDto);
  }
  @Get()
  @ApiOperation({ summary: 'Get all token mint events with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of token mint events',
    type: [TokenMintEventEntity],
  })
  @Roles(RoleEnum.admin)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.tokenMintEventService.findAll(page, limit);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get a token mint event by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Token mint event found',
    type: TokenMintEventEntity,
  })
  @ApiResponse({ status: 404, description: 'Token mint event not found' })
  @Roles(RoleEnum.admin)
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TokenMintEventEntity> {
    return this.tokenMintEventService.findOne(id);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update a token mint event' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Token mint event updated successfully',
    type: TokenMintEventEntity,
  })
  @ApiResponse({ status: 404, description: 'Token mint event not found' })
  @Roles(RoleEnum.admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTokenMintEventDto: UpdateTokenMintEventDto,
  ): Promise<TokenMintEventEntity> {
    return this.tokenMintEventService.update(id, updateTokenMintEventDto);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a token mint event' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 204,
    description: 'Token mint event deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Token mint event not found' })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.tokenMintEventService.remove(id);
  }
}
