import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import databaseConfig from '../../database/config/database.config';
import { DatabaseConfig } from '../../database/config/database-config.type';
const idType = (databaseConfig() as DatabaseConfig).isDocumentDatabase
  ? String
  : Number;
export class Status {
  @Allow()
  @ApiProperty({
    type: idType,
  })
  id: number | string;
  @Allow()
  @ApiProperty({
    type: String,
    example: 'active',
  })
  name?: string;
}
