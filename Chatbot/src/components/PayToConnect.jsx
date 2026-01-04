import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Wallet, X, Loader2, ExternalLink, CheckCircle, Unlock } from 'lucide-react';
import { useSolana } from '../hooks/useSolana';

const PayToConnect = ({ 
  recipientWallet, 
  recipientName, 
  accessFee = 0.1, // Default fee in SOL
  onAccessGranted,
  isRestricted = true 
}) => {
  const { 
    walletAddress, 
    balance, 
    isConnected, 
    isPhantomInstalled,
    connect, 
    payAccess,
    formatAddress 
  } = useSolana();
  
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txSignature, setTxSignature] = useState(null);
  const [error, setError] = useState(null);

  const handlePayForAccess = async () => {
    if (balance < accessFee) {
      setError('Insufficient balance');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const signature = await payAccess(recipientWallet, accessFee);
      setTxSignature(signature);
      onAccessGranted?.(signature);
    } catch (err) {
      setError(err.message || 'Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setTxSignature(null);
    setError(null);
  };

  // If not restricted or no recipient wallet, don't show
  if (!isRestricted || !recipientWallet) return null;

  return (
    <>
      {/* Access Restricted Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700/50 rounded-xl p-4 mb-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-amber-200 font-medium mb-1">Premium Access Required</h3>
            <p className="text-amber-300/70 text-sm mb-3">
              {recipientName || 'This assistant'} requires a one-time payment of {accessFee} SOL for full access.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-sm font-medium rounded-lg transition-all"
            >
              <Unlock className="w-4 h-4" />
              Unlock Access ({accessFee} SOL)
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {txSignature ? 'Access Granted!' : 'Unlock Access'}
                  </h3>
                  <button
                    onClick={resetModal}
                    className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  {!isPhantomInstalled ? (
                    // Phantom not installed
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wallet className="w-8 h-8 text-purple-400" />
                      </div>
                      <p className="text-gray-400 mb-4">Phantom wallet is required to unlock access</p>
                      <a
                        href="https://phantom.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        Install Phantom
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ) : !isConnected ? (
                    // Not connected
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wallet className="w-8 h-8 text-purple-400" />
                      </div>
                      <p className="text-gray-400 mb-4">Connect your wallet to unlock access</p>
                      <button
                        onClick={handleConnect}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        Connect Wallet
                      </button>
                    </div>
                  ) : txSignature ? (
                    // Success state
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      </div>
                      <p className="text-white font-medium mb-2">
                        Access unlocked successfully!
                      </p>
                      <p className="text-gray-400 text-sm mb-3">
                        You now have full access to {recipientName || 'this assistant'}
                      </p>
                      <a
                        href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 text-sm flex items-center justify-center gap-1"
                      >
                        View transaction
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    // Payment form
                    <div className="space-y-4">
                      {/* Access info */}
                      <div className="bg-gray-800/50 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {(recipientName || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{recipientName || 'Assistant'}</p>
                            <p className="text-gray-500 text-sm">Premium Access</p>
                          </div>
                        </div>
                        <div className="border-t border-gray-700 pt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Access Fee</span>
                            <span className="text-white font-semibold">{accessFee} SOL</span>
                          </div>
                        </div>
                      </div>

                      {/* Wallet info */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Your wallet</span>
                          <span className="text-white font-mono">{formatAddress(4)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Balance</span>
                          <span className={`font-medium ${balance < accessFee ? 'text-red-400' : 'text-green-400'}`}>
                            {balance.toFixed(4)} SOL
                          </span>
                        </div>
                      </div>

                      {/* Insufficient balance warning */}
                      {balance < accessFee && (
                        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3">
                          <p className="text-red-400 text-sm text-center">
                            Insufficient balance. You need at least {accessFee} SOL.
                          </p>
                        </div>
                      )}

                      {/* Error */}
                      {error && (
                        <p className="text-red-400 text-sm text-center">{error}</p>
                      )}

                      {/* Pay button */}
                      <button
                        onClick={handlePayForAccess}
                        disabled={isProcessing || balance < accessFee}
                        className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Unlock className="w-5 h-5" />
                            Pay {accessFee} SOL
                          </>
                        )}
                      </button>

                      <p className="text-gray-500 text-xs text-center">
                        Payment is processed on Solana blockchain. This is a one-time fee.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default PayToConnect;
