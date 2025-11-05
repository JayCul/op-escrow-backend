import { Controller, Get, Post, Body } from '@nestjs/common';
import { BlockchainService } from '../services/blockchain.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(private blockchainService: BlockchainService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get contract balance' })
  async getContractBalance() {
    const balance = await this.blockchainService.getContractBalance();
    return { balance };
  }

  @Get('network')
  @ApiOperation({ summary: 'Get network information' })
  async getNetworkInfo() {
    return this.blockchainService.getNetworkInfo();
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook for blockchain events' })
  async handleWebhook(@Body() body: any) {
    // Handle blockchain webhook events
    console.log('Webhook received:', body);
    return { received: true };
  }
}
