import { PartialType } from '@nestjs/swagger';
import { CreateTokenMintEventDto } from './create-token-mint-event.dto';

export class UpdateTokenMintEventDto extends PartialType(
  CreateTokenMintEventDto,
) {}
