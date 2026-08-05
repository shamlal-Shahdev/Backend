import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { UserWalletService } from './user-wallet.service';
import { ConnectWalletDto } from './dto/connect-wallet.dto';
import { UserWalletEntity } from './entity/user-wallet.entity';

@ApiTags('User Wallet')
@Controller({
  path: 'user-wallet',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class UserWalletController {
  constructor(private readonly userWalletService: UserWalletService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current logged-in user wallet details' })
  @ApiResponse({
    status: 200,
    description: 'User wallet address retrieved successfully',
  })
  @Roles(RoleEnum.user, RoleEnum.admin, RoleEnum.vendor)
  async getMyWallet(@Request() req): Promise<{ address: string | null }> {
    const userId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    const address = await this.userWalletService.getWalletAddressForUser(userId);
    return { address };
  }

  @Post('connect')
  @ApiOperation({ summary: 'Connect/Save MetaMask public wallet address' })
  @ApiResponse({
    status: 201,
    description: 'MetaMask wallet connected successfully',
    type: UserWalletEntity,
  })
  @Roles(RoleEnum.user, RoleEnum.admin)
  @HttpCode(HttpStatus.CREATED)
  async connectWallet(
    @Request() req,
    @Body() dto: ConnectWalletDto,
  ): Promise<UserWalletEntity> {
    const userId =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.userWalletService.connectWalletForUser(userId, dto.address);
  }
}
