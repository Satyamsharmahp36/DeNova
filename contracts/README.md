# ChatMate Solana Smart Contract

This directory contains the Anchor smart contract for ChatMate's on-chain features:

## Features

### 1. Permission Control
- Store AI assistant permissions on Solana
- Grant/revoke access to specific users
- Time-based permission expiration
- Permission types: Chat, Schedule, FullAccess

### 2. Pay-to-Connect
- Set access fees for your assistant (in SOL)
- Visitors pay to unlock access
- Direct wallet-to-wallet transfers
- On-chain payment receipts

### 3. Tipping
- Allow visitors to tip assistant owners
- Track total earnings on-chain

## Deployment Instructions

### Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### Build & Deploy
```bash
cd contracts

# Build the program
anchor build

# Get the program ID
solana address -k target/deploy/chatmate-keypair.json

# Update the program ID in:
# 1. Anchor.toml
# 2. lib.rs (declare_id!)
# 3. Frontend: Chatbot/src/services/solana.js (PROGRAM_ID)

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet (when ready)
anchor deploy --provider.cluster mainnet
```

### Testing
```bash
anchor test
```

## Program Accounts

### Assistant Account
- **Seeds**: `["assistant", owner_wallet]`
- Stores: owner, username, access_fee, total_earnings, is_access_restricted

### Permission Account
- **Seeds**: `["permission", assistant_pda, visitor_wallet]`
- Stores: permission_type, granted_at, expires_at, is_active, paid_amount

## Frontend Integration

The frontend integration is already set up in:
- `Chatbot/src/services/solana.js` - Solana service functions
- `Chatbot/src/hooks/useSolana.js` - React hook for wallet integration
- `Chatbot/src/components/TipButton.jsx` - Tipping UI component
- `Chatbot/src/components/PayToConnect.jsx` - Pay-to-access UI component

### Environment Variables
Add to your `.env` file:
```
VITE_SOLANA_NETWORK=devnet  # or 'mainnet' for production
```

## Hybrid Architecture

The system uses a **hybrid approach**:

1. **Wallet Users**: Permissions verified on-chain first, then MongoDB fallback
2. **Non-Wallet Users**: Use existing MongoDB-based access control
3. **Graceful Degradation**: If blockchain is unavailable, falls back to MongoDB

This ensures the app works for everyone, with blockchain as an enhancement rather than a requirement.
