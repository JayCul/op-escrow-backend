import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EscrowModule } from './escrow/escrow.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { BlockchainService } from './services/blockchain.service';
import { UsersModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/escrow-service',
    ),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    EscrowModule,
    AuthModule,
    BlockchainModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService, BlockchainService],
})
export class AppModule {}
