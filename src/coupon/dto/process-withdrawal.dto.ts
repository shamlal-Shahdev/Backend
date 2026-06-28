import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { WithdrawalStatus } from '../entity/withdrawal-request.entity';

export class ProcessWithdrawalDto {
  @ApiProperty({ enum: [WithdrawalStatus.APPROVED, WithdrawalStatus.REJECTED] })
  @IsEnum(WithdrawalStatus)
  status: WithdrawalStatus.APPROVED | WithdrawalStatus.REJECTED;
}
