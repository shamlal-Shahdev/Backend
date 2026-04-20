import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';

/** Calendar month for which `total_kwh` in the file is monthly consumption (YYYY-MM). */
export class CreateVendorUsageImportDto {
  @ApiProperty({ example: '2026-04', description: 'Year-month (YYYY-MM)' })
  @IsNotEmpty()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'periodYearMonth must be in format YYYY-MM',
  })
  periodYearMonth: string;
}
