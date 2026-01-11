import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class AssignVendorDto {
  @ApiProperty({ example: 1, description: 'Vendor user ID' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  vendorId: number;
}

