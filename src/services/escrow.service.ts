import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Escrow, EscrowDocument, EscrowStatus } from '../schemas/escrow.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionAction,
} from '../schemas/transaction.schema';
import { CreateEscrowDto } from '../dto/create-escrow.dto';
import { EscrowActionDto } from '../dto/escrow-action.dto';
import { BlockchainService } from '../services/blockchain.service';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class EscrowService {
  constructor(
    @InjectModel(Escrow.name) private escrowModel: Model<EscrowDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private blockchainService: BlockchainService,
  ) {}

  async createEscrow(createEscrowDto: CreateEscrowDto, buyerId: string) {
    const { seller, arbiter, amount, token } = createEscrowDto;

    // Validate users exist
    const sellerUser = await this.userModel.findById(seller);
    const arbiterUser = await this.userModel.findById(arbiter);

    if (!sellerUser || !arbiterUser) {
      throw new BadRequestException('Seller or arbiter not found');
    }

    // Create escrow on blockchain
    const blockchainEscrow = await this.blockchainService.createEscrow(
      sellerUser.walletAddress || '',
      arbiterUser.walletAddress || '',
      token,
      amount,
    );

    const escrow = new this.escrowModel({
      escrowId: blockchainEscrow.escrowId,
      buyer: new Types.ObjectId(buyerId),
      seller: new Types.ObjectId(seller),
      arbiter: new Types.ObjectId(arbiter),
      amount: amount.toString(),
      token,
      status: EscrowStatus.PENDING,
      transactionHash: blockchainEscrow.transactionHash,
    });

    await escrow.save();

    // Create transaction record
    await this.createTransaction(
      escrow._id as Types.ObjectId,
      blockchainEscrow.transactionHash,
      TransactionAction.CREATE,
      buyerId,
      sellerUser.walletAddress || '',
      amount.toString(),
    );

    return escrow;
  }

  async findAll(userId: string, filters: any) {
    const query: any = {
      $or: [
        { buyer: new Types.ObjectId(userId) },
        { seller: new Types.ObjectId(userId) },
        { arbiter: new Types.ObjectId(userId) },
      ],
    };

    if (filters.status) {
      query.status = filters.status;
    }

    return this.escrowModel
      .find(query)
      .populate('buyer', 'email walletAddress displayName')
      .populate('seller', 'email walletAddress displayName')
      .populate('arbiter', 'email walletAddress displayName')
      .sort({ createdAt: -1 });
  }

  async findOne(id: string, userId: string) {
    const escrow = await this.escrowModel
      .findOne({ _id: new Types.ObjectId(id) })
      .populate('buyer', 'email walletAddress displayName')
      .populate('seller', 'email walletAddress displayName')
      .populate('arbiter', 'email walletAddress displayName');

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    // Check if user is involved in this escrow
    const isInvolved =
      escrow.buyer._id.toString() === userId ||
      escrow.seller._id.toString() === userId ||
      escrow.arbiter._id.toString() === userId;

    if (!isInvolved) {
      throw new NotFoundException('Escrow not found');
    }

    return escrow;
  }

  async releaseFunds(escrowActionDto: EscrowActionDto, userId: string) {
    const { escrowId } = escrowActionDto;

    const escrow = await this.escrowModel.findOne({ escrowId });
    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    // Check if user is buyer or arbiter
    const isAuthorized =
      escrow.buyer.toString() === userId ||
      escrow.arbiter.toString() === userId;

    if (!isAuthorized) {
      throw new BadRequestException('Not authorized to release funds');
    }

    if (escrow.status !== EscrowStatus.FUNDED) {
      throw new BadRequestException('Escrow not in funded state');
    }

    const result = await this.blockchainService.releaseFunds(escrowId);

    escrow.status = EscrowStatus.COMPLETED;
    escrow.releaseTransactionHash = result.transactionHash;
    await escrow.save();

    await this.createTransaction(
      escrow._id as Types.ObjectId,
      result.transactionHash,
      TransactionAction.RELEASE,
      userId,
      escrow.seller.toString(),
      escrow.amount,
    );

    return {
      success: true,
      transactionHash: result.transactionHash,
      message: 'Funds released to seller',
    };
  }

  async refundBuyer(escrowActionDto: EscrowActionDto, userId: string) {
    const { escrowId } = escrowActionDto;

    const escrow = await this.escrowModel.findOne({ escrowId });
    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    // Check if user is seller or arbiter
    const isAuthorized =
      escrow.seller.toString() === userId ||
      escrow.arbiter.toString() === userId;

    if (!isAuthorized) {
      throw new BadRequestException('Not authorized to refund funds');
    }

    if (escrow.status !== EscrowStatus.FUNDED) {
      throw new BadRequestException('Escrow not in funded state');
    }

    const result = await this.blockchainService.refundBuyer(escrowId);

    escrow.status = EscrowStatus.REFUNDED;
    escrow.refundTransactionHash = result.transactionHash;
    await escrow.save();

    await this.createTransaction(
      escrow._id as Types.ObjectId,
      result.transactionHash,
      TransactionAction.REFUND,
      userId,
      escrow.buyer.toString(),
      escrow.amount,
    );

    return {
      success: true,
      transactionHash: result.transactionHash,
      message: 'Buyer refunded successfully',
    };
  }

  async raiseDispute(escrowActionDto: EscrowActionDto, userId: string) {
    const { escrowId, reason } = escrowActionDto;

    const escrow = await this.escrowModel.findOne({ escrowId });
    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    // Check if user is buyer or seller
    const isAuthorized =
      escrow.buyer.toString() === userId || escrow.seller.toString() === userId;

    if (!isAuthorized) {
      throw new BadRequestException('Not authorized to raise dispute');
    }

    escrow.status = EscrowStatus.DISPUTED;
    escrow.disputeReason = reason;
    await escrow.save();

    return {
      success: true,
      message: 'Dispute raised successfully',
    };
  }

  async getEscrowTransactions(escrowId: string) {
    return this.transactionModel
      .find({ escrowId: new Types.ObjectId(escrowId) })
      .sort({ createdAt: -1 });
  }

  private async createTransaction(
    escrowId: Types.ObjectId,
    txHash: string,
    action: TransactionAction,
    from: string,
    to: string,
    amount: string,
  ) {
    const transaction = new this.transactionModel({
      escrowId,
      txHash,
      action,
      from,
      to,
      amount,
      status: 'pending',
    });

    await transaction.save();
    return transaction;
  }

  // This would be called by blockchain event listeners
  async updateEscrowStatus(
    escrowId: number,
    status: EscrowStatus,
    txHash?: string,
  ) {
    const updateData: any = { status };

    if (txHash && status === EscrowStatus.FUNDED) {
      updateData.transactionHash = txHash;
    }

    await this.escrowModel.findOneAndUpdate({ escrowId }, updateData);
  }
}
