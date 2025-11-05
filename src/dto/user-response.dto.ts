import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({
    example: '0x742E4C3B4B6e3636e16B2aE6f3aC6c6A3c8B2a1C',
    required: false,
  })
  walletAddress?: string;

  @ApiProperty({ enum: ['local', 'google', 'github', 'metamask'] })
  authProvider: string;

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({ example: 'John Doe' })
  displayName: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  profileImage?: string;

  @ApiProperty({ example: 'This is my bio...', required: false })
  bio?: string;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
