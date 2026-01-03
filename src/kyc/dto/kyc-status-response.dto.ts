import { ApiProperty } from '@nestjs/swagger';
import { KycStatus } from '../../user/entity/user.entity';

export class KycStatusResponseDto {
  @ApiProperty({ enum: KycStatus, example: KycStatus.PENDING })
  status: KycStatus;

  @ApiProperty({ example: 1 })
  userId: number;
}
