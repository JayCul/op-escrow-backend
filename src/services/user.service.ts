import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { SearchUsersResponseDto } from 'src/dto/search-users-response.dto';
import { SearchUsersDto } from 'src/dto/search-users.dto';
import { UserResponseDto } from 'src/dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const {
      email,
      password,
      walletAddress,
      authProvider,
      displayName,
      profileImage,
    } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      $or: [
        { email: email.toLowerCase() },
        ...(walletAddress ? [{ walletAddress }] : []),
      ],
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email or wallet address already exists',
      );
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (password && authProvider === 'local') {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    const user = new this.userModel({
      email: email.toLowerCase(),
      password: hashedPassword,
      walletAddress,
      authProvider,
      displayName,
      profileImage,
      isVerified: authProvider !== 'local', // Auto-verify non-local auth
    });

    return await user.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel
      .find()
      .select('-password -refreshToken -verificationToken -resetPasswordToken')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel
      .findById(id)
      .select('-password -refreshToken -verificationToken -resetPasswordToken')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByDisplayName(displayName: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ displayName: displayName.toLowerCase() })
      .exec();
  }

  async findByWalletAddress(
    walletAddress: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne({ walletAddress }).exec();
  }

  async searchUsers(
    searchDto: SearchUsersDto,
    excludeUserId?: string,
  ): Promise<SearchUsersResponseDto> {
    const {
      email,
      displayName,
      walletAddress,
      limit = 10,
      page = 0,
    } = searchDto;

    // Build search query
    const query: any = {};

    if (email) {
      query.email = { $regex: email, $options: 'i' }; // Case-insensitive search
    }

    if (displayName) {
      query.displayName = { $regex: displayName, $options: 'i' }; // Case-insensitive search
    }

    if (walletAddress) {
      query.walletAddress = { $regex: walletAddress, $options: 'i' }; // Case-insensitive partial match
    }

    // Exclude current user if provided
    if (excludeUserId && excludeUserId !== '') {
      query._id = { $ne: new Types.ObjectId(excludeUserId) };
    }

    // Calculate pagination
    const skip = page * limit;

    // Execute search with pagination
    const [users, totalUsers] = await Promise.all([
      this.userModel
        .find(query)
        .select(
          '-password -refreshToken -verificationToken -resetPasswordToken',
        )
        .sort({ displayName: 1 }) // Sort alphabetically by display name
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages - 1;
    const hasPreviousPage = page > 0;

    return {
      users: users.map((user) => this.toUserResponseDto(user)),
      currentPage: page,
      limit,
      totalUsers,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  async searchUsersByMultipleFields(
    searchTerm: string,
    excludeUserId?: string,
    limit: number = 10,
    page: number = 0,
  ): Promise<SearchUsersResponseDto> {
    // Build search query across multiple fields
    const query: any = {
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { displayName: { $regex: searchTerm, $options: 'i' } },
        { walletAddress: { $regex: searchTerm, $options: 'i' } },
      ],
    };

    // Exclude current user if provided
    if (excludeUserId && excludeUserId !== '') {
      query._id = { $ne: new Types.ObjectId(excludeUserId) };
    }

    // Calculate pagination
    const skip = page * limit;

    // Execute search with pagination
    const [users, totalUsers] = await Promise.all([
      this.userModel
        .find(query)
        .select(
          '-password -refreshToken -verificationToken -resetPasswordToken',
        )
        .sort({ displayName: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages - 1;
    const hasPreviousPage = page > 0;

    return {
      users: users.map((user) => this.toUserResponseDto(user)),
      currentPage: page,
      limit,
      totalUsers,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
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

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.findById(id);

    // Check if email is being changed and if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email already taken');
      }
      updateUserDto.email = updateUserDto.email.toLowerCase();
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        { ...updateUserDto },
        { new: true, runValidators: true },
      )
      .select('-password -refreshToken -verificationToken -resetPasswordToken')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userModel.findById(id).select('+password');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.authProvider !== 'local') {
      throw new BadRequestException(
        'Password change not allowed for this authentication provider',
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      12,
    );

    await this.userModel.findByIdAndUpdate(id, {
      password: hashedNewPassword,
    });
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async getUserStats(userId: string): Promise<{
    totalEscrows: number;
    activeEscrows: number;
    completedEscrows: number;
    totalVolume: number;
  }> {
    // This would integrate with EscrowService to get user statistics
    // For now, returning mock data
    return {
      totalEscrows: 0,
      activeEscrows: 0,
      completedEscrows: 0,
      totalVolume: 0,
    };
  }

  async markEmailAsVerified(email: string): Promise<void> {
    const result = await this.userModel.updateOne(
      { email: email.toLowerCase() },
      { isVerified: true, verificationToken: null },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async setVerificationToken(email: string, token: string): Promise<void> {
    await this.userModel.updateOne(
      { email: email.toLowerCase() },
      { verificationToken: token },
    );
  }

  async setPasswordResetToken(
    email: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.userModel.updateOne(
      { email: email.toLowerCase() },
      {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    );
  }

  async findByResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.findByResetToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.userModel.updateOne(
      { _id: user._id },
      {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    );
  }
}
