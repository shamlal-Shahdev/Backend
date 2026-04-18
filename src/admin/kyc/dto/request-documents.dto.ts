import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray } from 'class-validator';
export enum DocumentType {
  CNIC_FRONT = 'cnic_front',
  CNIC_BACK = 'cnic_back',
  SELFIE = 'selfie',
  UTILITY_BILL = 'utility_bill',
}
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
  @ApiProperty({
    example: 'Please provide clearer images',
    description: 'Request message',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
