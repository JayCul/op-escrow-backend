import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsEnum,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ required: false, example: 'password123' })
  @IsOptional()
  @MinLength(6)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password?: string;

  @ApiProperty({
    required: false,
    example: '0x742E4C3B4B6e3636e16B2aE6f3aC6c6A3c8B2a1C',
  })
  @IsOptional()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Invalid wallet address format',
  })
  walletAddress?: string;

  @ApiProperty({
    enum: ['local', 'google', 'github', 'metamask'],
    example: 'local',
  })
  @IsEnum(['local', 'google', 'github', 'metamask'])
  authProvider: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  displayName: string;

  @ApiProperty({ required: false, example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  profileImage?: string;
}
