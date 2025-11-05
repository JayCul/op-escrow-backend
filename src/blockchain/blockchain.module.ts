import { Module } from '@nestjs/common';
import { BlockchainService } from '../services/blockchain.service';
import { BlockchainController } from '../controllers/blockchain.controller';

@Module({
  providers: [BlockchainService],
  controllers: [BlockchainController],
  exports: [BlockchainService],
})
export class BlockchainModule {}
