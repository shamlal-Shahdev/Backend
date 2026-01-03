import { PartialType } from '@nestjs/swagger';
import { CreateWalletBalanceDto } from './create-wallet-balance.dto';

export class UpdateWalletBalanceDto extends PartialType(
  CreateWalletBalanceDto,
) {}
