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
  Request,
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
import { WalletBalanceService } from './wallet-balance.service';
import { CreateWalletBalanceDto } from './dto/create-wallet-balance.dto';
import { UpdateWalletBalanceDto } from './dto/update-wallet-balance.dto';
import { WalletBalanceEntity } from './entity/wallet-balance.entity';
@ApiTags('Wallet Balances')
@Controller({
  path: 'wallet-balances',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class WalletBalanceController {
  constructor(private readonly walletBalanceService: WalletBalanceService) {}
  @Post()
  @ApiOperation({ summary: 'Create a new wallet balance' })
  @ApiResponse({
    status: 201,
    description: 'Wallet balance created successfully',
    type: WalletBalanceEntity,
  })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createWalletBalanceDto: CreateWalletBalanceDto,
  ): Promise<WalletBalanceEntity> {
    return this.walletBalanceService.create(createWalletBalanceDto);
  }
  @Get()
  @ApiOperation({ summary: 'Get all wallet balances with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of wallet balances',
    type: [WalletBalanceEntity],
  })
  @Roles(RoleEnum.admin)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.walletBalanceService.findAll(page, limit);
  }
  @Get('my-balance')
  @ApiOperation({ summary: 'Get current user spendable WATT balance' })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance retrieved successfully',
    type: WalletBalanceEntity,
  })
  @ApiResponse({ status: 404, description: 'User wallet not found' })
  @Roles(RoleEnum.user)
  async getMyBalance(@Request() req): Promise<WalletBalanceEntity> {
    const user = req.user;
    return await this.walletBalanceService.refreshBalanceFromLedger(user.id);
  }
  @Get('my-balance/sync')
  @ApiOperation({
    summary: 'Sync current user wallet with blockchain (re-mints if needed)',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance synced successfully',
    type: WalletBalanceEntity,
  })
  @ApiResponse({ status: 404, description: 'User wallet not found' })
  @Roles(RoleEnum.user)
  async syncMyBalance(@Request() req): Promise<WalletBalanceEntity> {
    const user = req.user;
    return await this.walletBalanceService.syncBalanceFromBlockchain(user.id);
  }
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get wallet balance by user ID' })
  @ApiParam({ name: 'userId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance found',
    type: WalletBalanceEntity,
  })
  @ApiResponse({ status: 404, description: 'Wallet balance not found' })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<WalletBalanceEntity> {
    return this.walletBalanceService.findByUserId(userId);
  }
  @Get('user/:userId/sync')
  @ApiOperation({ summary: 'Sync wallet balance from blockchain for a user' })
  @ApiParam({ name: 'userId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance synced successfully',
    type: WalletBalanceEntity,
  })
  @ApiResponse({ status: 404, description: 'User wallet not found' })
  @Roles(RoleEnum.admin)
  syncUserBalance(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<WalletBalanceEntity> {
    return this.walletBalanceService.syncBalanceFromBlockchain(userId);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get a wallet balance by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance found',
    type: WalletBalanceEntity,
  })
  @ApiResponse({ status: 404, description: 'Wallet balance not found' })
  @Roles(RoleEnum.admin)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<WalletBalanceEntity> {
    return this.walletBalanceService.findOne(id);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update a wallet balance' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance updated successfully',
    type: WalletBalanceEntity,
  })
  @ApiResponse({ status: 404, description: 'Wallet balance not found' })
  @Roles(RoleEnum.admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWalletBalanceDto: UpdateWalletBalanceDto,
  ): Promise<WalletBalanceEntity> {
    return this.walletBalanceService.update(id, updateWalletBalanceDto);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a wallet balance' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 204,
    description: 'Wallet balance deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Wallet balance not found' })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.walletBalanceService.remove(id);
  }
}
