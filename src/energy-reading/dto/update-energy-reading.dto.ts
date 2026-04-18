import { PartialType } from '@nestjs/swagger';
import { CreateEnergyReadingDto } from './create-energy-reading.dto';
export class UpdateEnergyReadingDto extends PartialType(
  CreateEnergyReadingDto,
) {}
