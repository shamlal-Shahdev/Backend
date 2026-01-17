import { ApiProperty } from '@nestjs/swagger';
import { EnergyRequestStatus } from '../entity/energy-request.entity';

export class EnergyRequestResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'https://example.com/uploads/meter-image.jpg' })
  meterImageUrl: string;

  @ApiProperty({ example: 'METER123456', nullable: true })
  meterIdFromImage: string | null;

  @ApiProperty({ example: 1 })
  month: number;

  @ApiProperty({ example: 2024 })
  year: number;

  @ApiProperty({ enum: EnergyRequestStatus, example: EnergyRequestStatus.PENDING })
  status: EnergyRequestStatus;

  @ApiProperty({ nullable: true })
  adminRemark: string | null;

  @ApiProperty({ nullable: true })
  approvedByAdminId: number | null;

  @ApiProperty({ nullable: true })
  rewardAmount: number | null;

  @ApiProperty({ nullable: true })
  blockchainTxHash: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

