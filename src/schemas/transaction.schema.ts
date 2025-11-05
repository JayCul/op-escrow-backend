import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionAction {
  CREATE = 'create',
  RELEASE = 'release',
  REFUND = 'refund',
  DISPUTE = 'dispute',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Escrow' })
  escrowId: Types.ObjectId;

  @Prop({ required: true })
  txHash: string;

  @Prop({
    required: true,
    enum: TransactionAction,
  })
  action: TransactionAction;

  @Prop({ required: true })
  from: string;

  @Prop({ required: true })
  to: string;

  @Prop({ required: true })
  amount: string;

  @Prop({
    required: true,
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Prop()
  blockNumber?: number;

  @Prop()
  gasUsed?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
