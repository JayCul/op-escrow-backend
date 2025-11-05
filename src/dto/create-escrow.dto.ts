import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsPositive,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEscrowDto {
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  seller: string;

  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  arbiter: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}
