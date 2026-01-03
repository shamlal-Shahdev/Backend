import { PartialType } from '@nestjs/swagger';
import { CreateInstallationDto } from './create-installation.dto';

export class UpdateInstallationDto extends PartialType(CreateInstallationDto) {}
