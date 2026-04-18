import { Controller, Get } from '@nestjs/common';
import { TokenService } from './token.service';
@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly tokenService: TokenService) {}
  @Get('token-info')
  async getTokenInfo() {
    return this.tokenService.getTokenInfo();
  }
  @Get('treasury-balance')
  async getTreasuryBalance() {
    return this.tokenService.getTreasuryBalance();
  }
}
