import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EscrowService } from '../services/escrow.service';
import { EscrowController } from '../controllers/escrow.controller';
import { Escrow, EscrowSchema } from '../schemas/escrow.schema';
import { Transaction, TransactionSchema } from '../schemas/transaction.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Escrow.name, schema: EscrowSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    BlockchainModule,
  ],
  providers: [EscrowService],
  controllers: [EscrowController],
  exports: [EscrowService],
})
export class EscrowModule {}
