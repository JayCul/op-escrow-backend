import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshJwtGuard extends AuthGuard('jwt-refresh') {
  // Special guard for refresh token endpoints
}
