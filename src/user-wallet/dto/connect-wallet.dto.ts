import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ConnectWalletDto {
  @ApiProperty({
    description: 'Ethereum public wallet address (0x...)',
    example: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Wallet address must be a valid 40-character hexadecimal Ethereum address starting with 0x',
  })
  address: string;
}
