import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EscrowDocument = Escrow & Document;

export enum EscrowStatus {
  PENDING = 'pending',
  FUNDED = 'funded',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Escrow {
  @Prop({ required: true, unique: true })
  escrowId: number;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  buyer: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  seller: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  arbiter: Types.ObjectId;

  @Prop({ required: true })
  amount: string;

  @Prop({ required: true })
  token: string;

  @Prop({
    required: true,
    enum: EscrowStatus,
    default: EscrowStatus.PENDING,
  })
  status: EscrowStatus;

  @Prop()
  transactionHash?: string;

  @Prop()
  releaseTransactionHash?: string;

  @Prop()
  refundTransactionHash?: string;

  @Prop()
  disputeReason?: string;
}

export const EscrowSchema = SchemaFactory.createForClass(Escrow);
