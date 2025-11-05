import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiProperty()
  @IsOptional()
  walletAddress?: string;

  @ApiProperty({ enum: ['local', 'metamask'] })
  @IsEnum(['local', 'metamask'])
  authProvider: string;

  @ApiProperty()
  @IsOptional()
  displayName?: string;
}
