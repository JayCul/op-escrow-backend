import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsUrl,
  IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ required: false, example: 'updated@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: 'New Display Name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  displayName?: string;

  @ApiProperty({
    required: false,
    example: 'https://example.com/new-avatar.jpg',
  })
  @IsOptional()
  @IsUrl()
  profileImage?: string;

  @ApiProperty({ required: false, example: 'This is my bio...' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
