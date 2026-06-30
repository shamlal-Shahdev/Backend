import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { WithdrawalStatus } from '../entity/withdrawal-request.entity';

export class ProcessWithdrawalDto {
  @ApiProperty({
    enum: [
      WithdrawalStatus.IN_PROGRESS,
      WithdrawalStatus.APPROVED,
      WithdrawalStatus.REJECTED,
    ],
  })
  @IsEnum(WithdrawalStatus)
  status:
    | WithdrawalStatus.IN_PROGRESS
    | WithdrawalStatus.APPROVED
    | WithdrawalStatus.REJECTED;
}
