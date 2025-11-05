import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';
import { RegisterDto } from 'src/dto/register.dto';
import { LoginDto } from 'src/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, walletAddress, authProvider, displayName } =
      registerDto;

    // Check if user exists
    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { walletAddress }],
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    const user = new this.userModel({
      email,
      password: hashedPassword,
      walletAddress,
      authProvider,
      displayName: displayName || email.split('@')[0],
      isVerified: authProvider === 'metamask',
    });

    await user.save();

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password, signature } = loginDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.authProvider === 'local' && password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else if (user.authProvider === 'metamask' && signature) {
      // Implement MetaMask signature verification
      const isValidSignature = await this.verifyMetaMaskSignature(
        user.walletAddress as string,
        signature,
      );
      if (!isValidSignature) {
        throw new UnauthorizedException('Invalid signature');
      }
    } else {
      throw new UnauthorizedException('Invalid login method');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async metamaskLogin(walletAddress: string, signature: string) {
    let user = await this.userModel.findOne({ walletAddress });

    if (!user) {
      user = new this.userModel({
        walletAddress,
        authProvider: 'metamask',
        isVerified: true,
        displayName: `user_${walletAddress.slice(2, 8)}`,
      });
      await user.save();
    }

    const isValidSignature = await this.verifyMetaMaskSignature(
      walletAddress,
      signature,
    );
    if (!isValidSignature) {
      throw new UnauthorizedException('Invalid signature');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: null });
  }

  private async generateTokens(user: UserDocument) {
    const payload = {
      email: user.email,
      sub: user.id,
      walletAddress: user.walletAddress,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  private sanitizeUser(user: UserDocument) {
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;
    return userObj;
  }

  private async verifyMetaMaskSignature(
    walletAddress: string,
    signature: string,
  ): Promise<boolean> {
    // Implement MetaMask signature verification logic
    // This is a simplified version - implement proper verification
    return true;
  }
}
