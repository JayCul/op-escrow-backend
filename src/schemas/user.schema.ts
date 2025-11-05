import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: function (doc, ret: any) {
      delete ret.password;
      delete ret.refreshToken;
      return ret;
    },
  },
})
export class User {
  @ApiProperty({ description: 'User ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'User email address' })
  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email',
    ],
  })
  email: string;

  @Prop({
    select: false,
  })
  password?: string;

  @ApiProperty({ description: 'Wallet address for MetaMask users' })
  @Prop({
    unique: true,
    sparse: true, // Allows multiple null values
    trim: true,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Please enter a valid wallet address'],
  })
  walletAddress?: string;

  @ApiProperty({
    description: 'Authentication provider',
    enum: ['local', 'google', 'github', 'metamask'],
  })
  @Prop({
    required: true,
    enum: ['local', 'google', 'github', 'metamask'],
    default: 'local',
  })
  authProvider: string;

  @ApiProperty({ description: 'Whether user email is verified' })
  @Prop({ default: false })
  isVerified: boolean;

  @ApiProperty({ description: 'User display name' })
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  })
  displayName: string;

  @Prop({ select: false })
  refreshToken?: string;

  @ApiProperty({ description: 'Email verification token' })
  @Prop({ select: false })
  verificationToken?: string;

  @ApiProperty({ description: 'Password reset token' })
  @Prop({ select: false })
  resetPasswordToken?: string;

  @ApiProperty({ description: 'Password reset token expiration' })
  @Prop({ select: false })
  resetPasswordExpires?: Date;

  @ApiProperty({ description: 'User profile image URL' })
  @Prop()
  profileImage?: string;

  @ApiProperty({ description: 'User bio' })
  @Prop({ maxlength: 500 })
  bio?: string;

  @ApiProperty({ description: 'User creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'User last update date' })
  updatedAt: Date;

  // Virtual for user's full profile URL
  get profileUrl(): string {
    return `/users/${String(this._id)}/profile`;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Index for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ walletAddress: 1 });
UserSchema.index({ authProvider: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual method to check if user has wallet
UserSchema.virtual('hasWallet').get(function () {
  return !!this.walletAddress;
});

// Instance method to check password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;

  const bcrypt = await import('bcrypt');
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find by email or wallet
UserSchema.statics.findByEmailOrWallet = function (
  email: string,
  walletAddress: string,
) {
  return this.findOne({
    $or: [{ email: email?.toLowerCase() }, { walletAddress }],
  });
};
