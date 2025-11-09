import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray } from 'class-validator';
import { DocumentType } from '../../kyc/infrastructure/persistence/relational/entities';

export class RequestDocumentsDto {
  @ApiProperty({
    example: [DocumentType.CNIC_FRONT, DocumentType.SELFIE],
    description: 'List of document types to request',
    isArray: true,
    enum: DocumentType,
  })
  @IsArray()
  @IsNotEmpty()
  documentTypes: DocumentType[];

  @ApiProperty({ example: 'Please provide clearer images', description: 'Request message' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

