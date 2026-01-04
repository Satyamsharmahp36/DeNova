import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Program ID - Update this after deploying the contract
const PROGRAM_ID = new PublicKey('H9oXVRXYTJEm4wHrSYnARhrARrBoUwAs1jTCvshXxbrU');

// Solana connection (devnet for development)
const SOLANA_NETWORK = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
const SOLANA_RPC = SOLANA_NETWORK === 'mainnet' 
  ? 'https://api.mainnet-beta.solana.com'
  : 'https://api.devnet.solana.com';

export const connection = new Connection(SOLANA_RPC, 'confirmed');

/**
 * Get Phantom wallet provider
 */
export const getPhantomProvider = () => {
  if (typeof window !== 'undefined' && window.solana?.isPhantom) {
    return window.solana;
  }
  return null;
};

/**
 * Connect to Phantom wallet
 */
export const connectWallet = async () => {
  const provider = getPhantomProvider();
  if (!provider) {
    throw new Error('Phantom wallet not found. Please install Phantom extension.');
  }
  
  const response = await provider.connect();
  return response.publicKey.toString();
};

/**
 * Disconnect from Phantom wallet
 */
export const disconnectWallet = async () => {
  const provider = getPhantomProvider();
  if (provider) {
    await provider.disconnect();
  }
};

/**
 * Get wallet balance in SOL
 */
export const getWalletBalance = async (walletAddress) => {
  try {
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting balance:', error);
    return 0;
  }
};

/**
 * Derive PDA for assistant account
 */
export const getAssistantPDA = (ownerWallet) => {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('assistant'), new PublicKey(ownerWallet).toBuffer()],
    PROGRAM_ID
  );
  return pda;
};

/**
 * Derive PDA for permission account
 */
export const getPermissionPDA = (assistantPDA, visitorWallet) => {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('permission'),
      new PublicKey(assistantPDA).toBuffer(),
      new PublicKey(visitorWallet).toBuffer()
    ],
    PROGRAM_ID
  );
  return pda;
};

/**
 * Send SOL to another wallet (simple transfer for tipping)
 * This works without the smart contract deployed
 */
export const sendTip = async (recipientWallet, amountInSol) => {
  const provider = getPhantomProvider();
  if (!provider) {
    throw new Error('Phantom wallet not found');
  }

  const senderPublicKey = provider.publicKey;
  const recipientPublicKey = new PublicKey(recipientWallet);
  
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: senderPublicKey,
      toPubkey: recipientPublicKey,
      lamports: Math.floor(amountInSol * LAMPORTS_PER_SOL),
    })
  );

  transaction.feePayer = senderPublicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  const signed = await provider.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize());
  
  await connection.confirmTransaction(signature, 'confirmed');
  
  return signature;
};

/**
 * Pay for access to an assistant
 * Falls back to simple transfer if contract not deployed
 */
export const payForAccess = async (assistantOwnerWallet, amountInSol) => {
  // For now, use simple transfer until contract is deployed
  return sendTip(assistantOwnerWallet, amountInSol);
};

/**
 * Check if user has on-chain permission
 * Returns null if contract not deployed (fallback to MongoDB)
 */
export const checkOnChainPermission = async (assistantOwnerWallet, visitorWallet) => {
  try {
    const assistantPDA = getAssistantPDA(assistantOwnerWallet);
    const permissionPDA = getPermissionPDA(assistantPDA, visitorWallet);
    
    const accountInfo = await connection.getAccountInfo(permissionPDA);
    
    if (!accountInfo) {
      return null; // No on-chain permission, fallback to MongoDB
    }
    
    // Parse permission data (simplified - full implementation needs IDL)
    // For now, just check if account exists
    return { hasPermission: true };
  } catch (error) {
    console.log('On-chain permission check failed, using fallback:', error.message);
    return null; // Fallback to MongoDB
  }
};

/**
 * Format wallet address for display
 */
export const formatWalletAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

/**
 * Convert lamports to SOL
 */
export const lamportsToSol = (lamports) => {
  return lamports / LAMPORTS_PER_SOL;
};

/**
 * Convert SOL to lamports
 */
export const solToLamports = (sol) => {
  return Math.floor(sol * LAMPORTS_PER_SOL);
};

export default {
  connection,
  getPhantomProvider,
  connectWallet,
  disconnectWallet,
  getWalletBalance,
  sendTip,
  payForAccess,
  checkOnChainPermission,
  formatWalletAddress,
  lamportsToSol,
  solToLamports,
  PROGRAM_ID,
  SOLANA_NETWORK,
};
