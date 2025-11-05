# Escrow DApp Backend

A complete NestJS backend for a decentralized escrow application that facilitates secure transactions between buyers and sellers with arbiter oversight.

## 🚀 Features

- **🔐 Authentication System**
  - JWT-based authentication
  - Email/password registration & login
  - MetaMask wallet integration
  - Refresh token mechanism

- **💰 Escrow Management**
  - Create and manage escrow agreements
  - Fund release and refund functionality
  - Dispute resolution system
  - Real-time status tracking

- **⛓️ Blockchain Integration**
  - Smart contract interactions
  - Ethereum blockchain support
  - Transaction history tracking
  - Event listening

- **👥 User Management**
  - User profiles and preferences
  - Search and discovery features
  - Role-based access control

## 🛠 Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: MongoDB with Mongoose
- **Blockchain**: Ethers.js v6
- **Authentication**: JWT with Passport
- **API Documentation**: Swagger/OpenAPI
- **Validation**: Class Validator & Class Transformer
- **Testing**: Jest (Unit & E2E)

## 📋 Prerequisites

- Node.js 18+
- MongoDB 5.0+
- Ethereum wallet (for blockchain interactions)
- npm or yarn

## ⚙️ Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd escrow-dapp-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Configuration**

```bash
cp .env.example .env
```

4. **Configure Environment Variables**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/escrow-dapp

# JWT Authentication
JWT_ACCESS_SECRET=your-super-secure-access-token-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-token-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Blockchain Configuration
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/your-project-id
ESCROW_PRIVATE_KEY=0xYourPrivateKeyStartsWith0xAnd64HexCharacters
ESCROW_CONTRACT_ADDRESS=0xYourDeployedContractAddress

# Application
NODE_ENV=development
PORT=3000
```

5. **Start the application**

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 🔧 API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/metamask` - MetaMask authentication
- `POST /auth/refresh` - Refresh JWT tokens
- `POST /auth/logout` - User logout

### Users

- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update user profile
- `GET /users/search` - Search users (excludes current user)
- `GET /users/search/:term` - Search users by term
- `GET /users/suggestions` - Get user suggestions

### Escrows

- `POST /escrows` - Create new escrow
- `GET /escrows` - List user's escrows
- `GET /escrows/:id` - Get escrow details
- `POST /escrows/:id/release` - Release funds to seller
- `POST /escrows/:id/refund` - Refund buyer
- `POST /escrows/:id/dispute` - Raise dispute
- `GET /escrows/:id/transactions` - Get escrow transactions

### Blockchain

- `GET /blockchain/balance` - Get contract balance
- `GET /blockchain/network` - Get network information
- `POST /blockchain/webhook` - Blockchain event webhook

## 🗄 Database Models

### User

```typescript
{
  email: string;
  password?: string; // Hashed
  walletAddress?: string;
  authProvider: 'local' | 'google' | 'github' | 'metamask';
  isVerified: boolean;
  displayName: string;
  refreshToken?: string; // Hashed
  profileImage?: string;
  bio?: string;
}
```

### Escrow

```typescript
{
  escrowId: number; // Blockchain escrow ID
  buyer: ObjectId; // Reference to User
  seller: ObjectId; // Reference to User
  arbiter: ObjectId; // Reference to User
  amount: string;
  token: string;
  status: 'pending' | 'funded' | 'completed' | 'refunded' | 'disputed' | 'cancelled';
  transactionHash?: string;
  releaseTransactionHash?: string;
  refundTransactionHash?: string;
  disputeReason?: string;
}
```

### Transaction

```typescript
{
  escrowId: ObjectId; // Reference to Escrow
  txHash: string;
  action: 'create' | 'release' | 'refund' | 'dispute';
  from: string;
  to: string;
  amount: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
}
```

## 🔐 Authentication Flow

### Traditional Login

1. User registers with email/password
2. System hashes password and creates user
3. User logs in with credentials
4. System returns JWT access and refresh tokens

### MetaMask Login

1. User connects MetaMask wallet
2. Frontend requests signature
3. Backend verifies signature
4. System creates/locates user and returns tokens

## 💼 Escrow Workflow

1. **Creation**: Buyer creates escrow with seller, arbiter, amount, and token
2. **Funding**: Buyer deposits funds into escrow contract
3. **Completion**: Buyer or arbiter releases funds to seller
4. **Refund**: Seller or arbiter refunds buyer
5. **Dispute**: Either party can raise disputes for arbiter resolution

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📚 API Documentation

Once running, access Swagger documentation at:

```
http://localhost:3000/api
```

## 🔧 Development

### Code Structure

```
src/
├── auth/                 # Authentication module
├── users/               # User management
├── escrow/              # Escrow management
├── blockchain/          # Blockchain interactions
├── schemas/             # MongoDB schemas
├── config/              # Configuration files
└── main.ts              # Application entry point
```

### Adding New Features

1. Create schema in `src/schemas/`
2. Define DTOs with validation
3. Implement service logic
4. Create controller endpoints
5. Add Swagger documentation
6. Write tests

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Environment Setup for Production

- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure production MongoDB
- Set up proper RPC endpoints
- Enable rate limiting
- Configure CORS for your domain

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please:

1. Check the API documentation at `/api`
2. Review the application logs
3. Check blockchain network status
4. Verify environment configuration

## 🔗 Related Projects

- [Escrow DApp Frontend](https://github.com/JayCul/op-escrow-frontend)
- [Escrow Smart Contracts](https://github.com/JayCul/op-escrow-smart-contract)

## 📞 Contact

Project Maintainer - [JayCul](mailto:jaystechub@gmail.com)

Project Link: [https://github.com/JayCul/op-escrow-backend](https://github.com/JayCul/op-escrow-backend)

---

**Note**: This application interacts with real blockchain networks. Always use test networks for development and ensure you understand the security implications before deploying to production.
