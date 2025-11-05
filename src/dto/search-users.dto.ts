import { IsOptional, IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SearchUsersDto {
  @ApiProperty({ required: false, example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiProperty({ required: false, example: 'john_doe' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toLowerCase().trim())
  displayName?: string;

  @ApiProperty({
    required: false,
    example: '0x742E4C3B4B6e3636e16B2aE6f3aC6c6A3c8B2a1C',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  walletAddress?: string;

  @ApiProperty({
    required: false,
    example: 10,
    description: 'Number of results per page',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @ApiProperty({
    required: false,
    example: 0,
    description: 'Page number for pagination',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 0;
}
