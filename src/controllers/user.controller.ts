import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
  //   ParseArrayPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UsersService } from '../services/user.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { User, UserDocument } from 'src/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { SearchUsersResponseDto } from 'src/dto/search-users-response.dto';
import { SearchUsersDto } from 'src/dto/search-users.dto';
import { InjectModel } from '@nestjs/mongoose';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.userId);
    return this.toUserResponseDto(user);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: UserResponseDto,
  })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(req.user.userId, updateUserDto);
    return this.toUserResponseDto(user);
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(req.user.userId, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
  })
  async getUserStats(@Request() req) {
    return this.usersService.getUserStats(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return this.toUserResponseDto(user);
  }

  @Delete('profile')
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({
    status: 200,
    description: 'User account deleted successfully',
  })
  async remove(@Request() req) {
    await this.usersService.remove(req.user.userId);
    return { message: 'User account deleted successfully' };
  }

  // Helper method to convert UserDocument to UserResponseDto
  private toUserResponseDto(user: UserDocument): UserResponseDto {
    return {
      id: user._id.toString(),
      email: user.email,
      walletAddress: user.walletAddress,
      authProvider: user.authProvider,
      isVerified: user.isVerified,
      displayName: user.displayName,
      profileImage: user.profileImage,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search users by email, display name, or wallet address',
    description:
      'Search for users while excluding the current user from results. Supports partial matches and pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Users found successfully',
    type: SearchUsersResponseDto,
  })
  async searchUsers(
    @Query() searchDto: SearchUsersDto,
    @Request() req,
  ): Promise<SearchUsersResponseDto> {
    return this.usersService.searchUsers(searchDto, req.user.userId);
  }

  @Get('search/:term')
  @ApiOperation({
    summary: 'Search users by any field',
    description:
      'Search across email, display name, and wallet address with a single search term. Excludes current user.',
  })
  @ApiParam({
    name: 'term',
    description:
      'Search term to look for in email, display name, or wallet address',
    example: 'john',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results per page (default: 10)',
    example: 10,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (default: 0)',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Users found successfully',
    type: SearchUsersResponseDto,
  })
  async searchUsersByTerm(
    @Param('term') searchTerm: string,
    @Query('limit') limit: number = 10,
    @Query('page') page: number = 0,
    @Request() req,
  ): Promise<SearchUsersResponseDto> {
    return this.usersService.searchUsersByMultipleFields(
      searchTerm,
      req.user.userId,
      Number(limit),
      Number(page),
    );
  }

  @Get('suggestions')
  @ApiOperation({
    summary: 'Get user suggestions',
    description:
      'Get a list of users for suggestions, excluding current user. Useful for selecting buyers, sellers, or arbiters.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of suggestions to return (default: 20)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'User suggestions retrieved successfully',
    type: [UserResponseDto],
  })
  async getUserSuggestions(
    @Query('limit') limit: number = 20,
    @Request() req,
  ): Promise<UserResponseDto[]> {
    // Get recent active users, excluding current user
    const users = await this.userModel
      .find({
        _id: { $ne: new Types.ObjectId(req.user.userId) },
        isVerified: true, // Only suggest verified users
      })
      .select('-password -refreshToken -verificationToken -resetPasswordToken')
      .sort({ createdAt: -1 }) // Most recent first
      .limit(Number(limit))
      .exec();

    return users.map((user) => this.toUserResponseDto(user));
  }
}
