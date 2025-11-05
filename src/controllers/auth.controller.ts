import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from 'src/dto/login.dto';
import { RegisterDto } from 'src/dto/register.dto';
import { AuthService } from 'src/services/auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('metamask')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'MetaMask login' })
  async metamaskLogin(
    @Body() body: { walletAddress: string; signature: string },
  ) {
    return this.authService.metamaskLogin(body.walletAddress, body.signature);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT token' })
  async refreshTokens(@Body() body: { refreshToken: string }) {
    // In practice, you'd get user ID from JWT
    return this.authService.refreshTokens('user-id', body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  async logout(@Body() body: { userId: string }) {
    return this.authService.logout(body.userId);
  }
}
