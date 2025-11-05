import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EscrowActionDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  escrowId: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
