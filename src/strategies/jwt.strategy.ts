import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    // You can add additional validation here, like checking if user still exists
    const user = await this.userModel.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isVerified && user.authProvider === 'local') {
      throw new UnauthorizedException('Please verify your email address');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      walletAddress: payload.walletAddress,
      authProvider: user.authProvider,
    };
  }
}
