import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class SearchUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  users: UserResponseDto[];

  @ApiProperty({ example: 1 })
  currentPage: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 25 })
  totalUsers: number;

  @ApiProperty({ example: 3 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}
