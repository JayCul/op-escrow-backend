import { registerAs } from '@nestjs/config';

export default registerAs('blockchain', () => {
  const privateKey = process.env.ESCROW_PRIVATE_KEY;

  // Basic validation
  if (!privateKey) {
    throw new Error('ESCROW_PRIVATE_KEY is required');
  }

  if (!privateKey.startsWith('0x')) {
    throw new Error('ESCROW_PRIVATE_KEY must start with 0x');
  }

  return {
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL,
    privateKey: privateKey,
    contractAddress: process.env.ESCROW_CONTRACT_ADDRESS,
  };
});
