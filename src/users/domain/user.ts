import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty({
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'john.doe@example.com',
  })
  @Expose({ groups: ['me', 'admin'] })
  email: string;

  @Exclude({ toPlainOnly: true })
  password: string;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  isVerified: boolean;

  @Exclude({ toPlainOnly: true })
  verificationToken?: string | null;

  @Exclude({ toPlainOnly: true })
  resetToken?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
