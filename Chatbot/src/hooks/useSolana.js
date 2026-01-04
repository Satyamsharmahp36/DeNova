import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import {
  getPhantomProvider,
  connectWallet,
  disconnectWallet,
  getWalletBalance,
  sendTip,
  payForAccess,
  checkOnChainPermission,
  formatWalletAddress,
} from '../services/solana';

/**
 * Custom hook for Solana wallet integration
 */
export const useSolana = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);
  const [error, setError] = useState(null);

  // Check if Phantom is installed on mount
  useEffect(() => {
    const provider = getPhantomProvider();
    setIsPhantomInstalled(!!provider);

    // Check for existing connection
    const savedWallet = Cookies.get('walletAddress');
    if (savedWallet && provider?.isConnected) {
      setWalletAddress(savedWallet);
      fetchBalance(savedWallet);
    }

    // Listen for wallet events
    if (provider) {
      provider.on('connect', (publicKey) => {
        const address = publicKey.toString();
        setWalletAddress(address);
        Cookies.set('walletAddress', address);
        fetchBalance(address);
      });

      provider.on('disconnect', () => {
        setWalletAddress(null);
        setBalance(0);
        Cookies.remove('walletAddress');
      });

      provider.on('accountChanged', (publicKey) => {
        if (publicKey) {
          const address = publicKey.toString();
          setWalletAddress(address);
          Cookies.set('walletAddress', address);
          fetchBalance(address);
        } else {
          setWalletAddress(null);
          setBalance(0);
          Cookies.remove('walletAddress');
        }
      });
    }

    return () => {
      if (provider) {
        provider.removeAllListeners?.('connect');
        provider.removeAllListeners?.('disconnect');
        provider.removeAllListeners?.('accountChanged');
      }
    };
  }, []);

  const fetchBalance = async (address) => {
    try {
      const bal = await getWalletBalance(address);
      setBalance(bal);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      Cookies.set('walletAddress', address);
      await fetchBalance(address);
      return address;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await disconnectWallet();
      setWalletAddress(null);
      setBalance(0);
      Cookies.remove('walletAddress');
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  }, []);

  const tip = useCallback(async (recipientWallet, amountInSol) => {
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const signature = await sendTip(recipientWallet, amountInSol);
      await fetchBalance(walletAddress); // Refresh balance after tip
      return signature;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [walletAddress]);

  const payAccess = useCallback(async (assistantOwnerWallet, amountInSol) => {
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const signature = await payForAccess(assistantOwnerWallet, amountInSol);
      await fetchBalance(walletAddress);
      return signature;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [walletAddress]);

  const checkPermission = useCallback(async (assistantOwnerWallet) => {
    if (!walletAddress) {
      return null; // Not connected, use MongoDB fallback
    }
    
    return checkOnChainPermission(assistantOwnerWallet, walletAddress);
  }, [walletAddress]);

  const refreshBalance = useCallback(() => {
    if (walletAddress) {
      fetchBalance(walletAddress);
    }
  }, [walletAddress]);

  return {
    walletAddress,
    balance,
    isConnecting,
    isPhantomInstalled,
    isConnected: !!walletAddress,
    error,
    connect,
    disconnect,
    tip,
    payAccess,
    checkPermission,
    refreshBalance,
    formatAddress: (chars) => formatWalletAddress(walletAddress, chars),
  };
};

export default useSolana;
