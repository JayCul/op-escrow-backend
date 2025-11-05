import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EscrowService } from '../services/escrow.service';
import { CreateEscrowDto } from '../dto/create-escrow.dto';
import { EscrowActionDto } from '../dto/escrow-action.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('escrows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('escrows')
export class EscrowController {
  constructor(private escrowService: EscrowService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new escrow' })
  async createEscrow(@Body() createEscrowDto: CreateEscrowDto, @Request() req) {
    return this.escrowService.createEscrow(createEscrowDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all escrows for user' })
  async getEscrows(@Query() filters: any, @Request() req) {
    return this.escrowService.findAll(req.user.userId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get escrow details' })
  async getEscrow(@Param('id') id: string, @Request() req) {
    return this.escrowService.findOne(id, req.user.userId);
  }

  @Post(':id/release')
  @ApiOperation({ summary: 'Release funds to seller' })
  async releaseFunds(@Body() escrowActionDto: EscrowActionDto, @Request() req) {
    return this.escrowService.releaseFunds(escrowActionDto, req.user.userId);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund buyer' })
  async refundBuyer(@Body() escrowActionDto: EscrowActionDto, @Request() req) {
    return this.escrowService.refundBuyer(escrowActionDto, req.user.userId);
  }

  @Post(':id/dispute')
  @ApiOperation({ summary: 'Raise dispute' })
  async raiseDispute(@Body() escrowActionDto: EscrowActionDto, @Request() req) {
    return this.escrowService.raiseDispute(escrowActionDto, req.user.userId);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Get escrow transactions' })
  async getTransactions(@Param('id') id: string) {
    return this.escrowService.getEscrowTransactions(id);
  }
}
