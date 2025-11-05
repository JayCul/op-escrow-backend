import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import * as EscrowABI from '../contracts/EscrowABI.json';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private isInitialized = false;

  constructor(private configService: ConfigService) {}

  // Define validatePrivateKey BEFORE it's used
  private validatePrivateKey(privateKey: string): void {
    if (!privateKey) {
      throw new Error('Private key is required');
    }

    // Remove any whitespace
    const cleanPrivateKey = privateKey.trim();

    // Check if it starts with 0x -- NOT CHECKING THIS
    // if (!cleanPrivateKey.startsWith('0x')) {
    //   throw new Error('Private key must start with 0x');
    // }

    // Check length (64 hex chars + 0x prefix = 66 characters)
    // if (cleanPrivateKey.length !== 66) {
    //   throw new Error(
    //     `Private key must be 64 hex characters long. Got ${cleanPrivateKey.length - 2} characters`,
    //   );
    // }

    // Check if it's a valid hex string
    // if (!/^0x[0-9a-fA-F]{64}$/.test(cleanPrivateKey)) {
    //   throw new Error('Private key must contain only valid hex characters');
    // }

    // Try to create a wallet to validate the private key
    try {
      new ethers.Wallet(cleanPrivateKey);
      console.log(privateKey);
    } catch (error) {
      throw new Error(`Invalid private key: ${error.message}`);
    }
  }

  private validateAddress(address: string, name: string): void {
    const nameStr = String(name);
    const addrStr = String(address);

    if (!ethers.isAddress(address)) {
      throw new Error(`Invalid ${nameStr}: ${addrStr}`);
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }
  }

  private handleBlockchainError(error: any): Error {
    if (error.message.includes('insufficient funds')) {
      return new Error('Insufficient funds for transaction');
    } else if (error.message.includes('nonce')) {
      return new Error('Transaction nonce error');
    } else if (error.message.includes('reverted')) {
      return new Error(
        `Contract reverted: ${error.reason || 'Unknown reason'}`,
      );
    } else if (error.code === 'CALL_EXCEPTION') {
      return new Error('Contract call exception - check function parameters');
    }

    return new Error(`Blockchain error: ${error.message}`);
  }

  async onModuleInit() {
    await this.initializeBlockchainConnection();
  }

  private async initializeBlockchainConnection() {
    try {
      const rpcUrl = this.configService.get<string>('BLOCKCHAIN_RPC_URL');
      const privateKey = this.configService.get<string>('ESCROW_PRIVATE_KEY');
      const contractAddress = this.configService.get<string>(
        'ESCROW_CONTRACT_ADDRESS',
      );

      // Validate environment variables
      if (!rpcUrl || !privateKey || !contractAddress) {
        throw new Error('Missing required blockchain environment variables');
      }

      // Now validatePrivateKey is defined above
      this.validatePrivateKey(privateKey);

      this.logger.log('Initializing blockchain connection...');

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      // Verify wallet connection
      const walletAddress = await this.wallet.getAddress();
      this.logger.log(`Connected with wallet: ${walletAddress}`);

      // Verify network connection
      const network = await this.provider.getNetwork();
      this.logger.log(
        `Connected to network: ${network.name} (Chain ID: ${network.chainId})`,
      );

      // Use the imported ABI
      const contractABI = EscrowABI.abi || EscrowABI;

      this.contract = new ethers.Contract(
        contractAddress,
        contractABI,
        this.wallet,
      );

      // Verify contract connection
      const code = await this.provider.getCode(contractAddress);
      if (code === '0x') {
        throw new Error(`No contract found at address: ${contractAddress}`);
      }

      this.isInitialized = true;
      this.logger.log('Blockchain connection initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize blockchain connection: ${error.message}`,
      );
      throw error;
    }
  }

  async createEscrow(
    seller: string,
    arbiter: string,
    token: string,
    amount: number,
  ) {
    this.ensureInitialized();

    try {
      this.validateAddress(seller, 'Seller address');
      this.validateAddress(arbiter, 'Arbiter address');
      this.validateAddress(token, 'Token address');

      this.logger.log(
        `Creating escrow: seller=${seller}, arbiter=${arbiter}, token=${token}, amount=${amount}`,
      );

      // Check if createEscrow function exists in ABI
      if (!this.contract.createEscrow) {
        throw new Error('createEscrow function not found in contract ABI');
      }

      const tx = await this.contract.createEscrow(
        seller,
        arbiter,
        token,
        amount,
        { value: amount }, // Adjust based on your contract requirements
      );

      this.logger.log(`Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      this.logger.log(`Transaction confirmed in block: ${receipt.blockNumber}`);

      // Extract escrowId from events
      const escrowCreatedEvent = receipt.logs.find((log) => {
        try {
          const parsedLog = this.contract.interface.parseLog(log);
          return parsedLog?.name === 'EscrowCreated';
        } catch {
          return false;
        }
      });

      if (!escrowCreatedEvent) {
        throw new Error('EscrowCreated event not found in transaction receipt');
      }

      const parsedEvent = this.contract.interface.parseLog(escrowCreatedEvent);
      const escrowId = parsedEvent?.args.escrowId || parsedEvent?.args[0];

      this.logger.log(`Escrow created with ID: ${escrowId}`);

      return {
        escrowId: escrowId.toString(),
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      this.logger.error(`Failed to create escrow: ${error.message}`);
      throw this.handleBlockchainError(error);
    }
  }

  async releaseFunds(escrowId: number) {
    this.ensureInitialized();

    try {
      this.logger.log(`Releasing funds for escrow: ${escrowId}`);

      if (!this.contract.releaseFunds) {
        throw new Error('releaseFunds function not found in contract ABI');
      }

      const tx = await this.contract.releaseFunds(escrowId);
      this.logger.log(`Release transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      this.logger.log(
        `Release transaction confirmed in block: ${receipt.blockNumber}`,
      );

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      this.logger.error(`Failed to release funds: ${error.message}`);
      throw this.handleBlockchainError(error);
    }
  }

  async refundBuyer(escrowId: number) {
    this.ensureInitialized();

    try {
      this.logger.log(`Refunding buyer for escrow: ${escrowId}`);

      if (!this.contract.refundBuyer) {
        throw new Error('refundBuyer function not found in contract ABI');
      }

      const tx = await this.contract.refundBuyer(escrowId);
      this.logger.log(`Refund transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      this.logger.log(
        `Refund transaction confirmed in block: ${receipt.blockNumber}`,
      );

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      this.logger.error(`Failed to refund buyer: ${error.message}`);
      throw this.handleBlockchainError(error);
    }
  }

  async getEscrow(escrowId: number) {
    this.ensureInitialized();

    try {
      if (!this.contract.getEscrow) {
        throw new Error('getEscrow function not found in contract ABI');
      }

      return await this.contract.getEscrow(escrowId);
    } catch (error) {
      this.logger.error(`Failed to get escrow: ${error.message}`);
      throw this.handleBlockchainError(error);
    }
  }

  async getArbiter() {
    this.ensureInitialized();

    try {
      if (!this.contract.arbiter) {
        throw new Error('arbiter function not found in contract ABI');
      }

      return await this.contract.arbiter();
    } catch (error) {
      this.logger.error(`Failed to get arbiter: ${error.message}`);
      throw this.handleBlockchainError(error);
    }
  }

  async getContractBalance(): Promise<string> {
    this.ensureInitialized();

    try {
      const balance = await this.provider.getBalance(this.contract.target);
      return ethers.formatEther(balance);
    } catch (error) {
      this.logger.error(`Failed to get contract balance: ${error.message}`);
      throw this.handleBlockchainError(error);
    }
  }

  async getNetworkInfo() {
    this.ensureInitialized();

    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getFeeData();

      return {
        name: network.name,
        chainId: Number(network.chainId),
        blockNumber,
        gasPrice: gasPrice.gasPrice
          ? ethers.formatUnits(gasPrice.gasPrice, 'gwei')
          : '0',
      };
    } catch (error) {
      this.logger.error(`Failed to get network info: ${error.message}`);
      throw this.handleBlockchainError(error);
    }
  }

  // Event listeners for blockchain events
  async listenToEscrowEvents() {
    this.ensureInitialized();

    this.contract.on(
      'EscrowCreated',
      (escrowId, buyer, seller, arbiter, amount, token, event) => {
        this.logger.log(
          `New escrow created: ${escrowId}, Buyer: ${buyer}, Seller: ${seller}`,
        );
        // Update database with new escrow
      },
    );

    this.contract.on('FundsReleased', (escrowId, seller, amount, event) => {
      this.logger.log(
        `Funds released for escrow: ${escrowId}, Seller: ${seller}, Amount: ${amount}`,
      );
      // Update escrow status in database
    });

    this.contract.on('FundsRefunded', (escrowId, buyer, amount, event) => {
      this.logger.log(
        `Funds refunded for escrow: ${escrowId}, Buyer: ${buyer}, Amount: ${amount}`,
      );
      // Update escrow status in database
    });
  }

  // Cleanup method to remove event listeners
  async removeEventListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }
}
