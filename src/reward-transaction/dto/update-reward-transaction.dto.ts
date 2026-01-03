import { PartialType } from '@nestjs/swagger';
import { CreateRewardTransactionDto } from './create-reward-transaction.dto';

export class UpdateRewardTransactionDto extends PartialType(
  CreateRewardTransactionDto,
) {}
