import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ItemType } from '../entity/marketplace-item.entity';
export class CreateMarketplaceItemDto {
  @ApiProperty({ example: 'Amazon Gift Card $50' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;
  @ApiProperty({ example: 100.5 })
  @IsNumber()
  @Min(0)
  priceTokens: number;
  @ApiProperty({ enum: ItemType, example: ItemType.VOUCHER })
  @IsEnum(ItemType)
  itemType: ItemType;
  @ApiProperty({ default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
