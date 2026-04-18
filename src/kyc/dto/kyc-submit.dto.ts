import { ApiProperty } from '@nestjs/swagger';
export class KycSubmitDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'CNIC Front Image',
  })
  cnicFront: any;
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'CNIC Back Image',
  })
  cnicBack: any;
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Utility Bill Image',
  })
  utilityBill: any;
}
