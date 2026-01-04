import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, X, Send, Loader2, ExternalLink, CheckCircle } from 'lucide-react';
import { useSolana } from '../hooks/useSolana';

const TipButton = ({ recipientWallet, recipientName, onSuccess }) => {
  const { 
    walletAddress, 
    balance, 
    isConnected, 
    isPhantomInstalled,
    connect, 
    tip,
    formatAddress 
  } = useSolana();
  
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txSignature, setTxSignature] = useState(null);
  const [error, setError] = useState(null);

  const presetAmounts = [0.01, 0.05, 0.1, 0.5];

  const handleTip = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > balance) {
      setError('Insufficient balance');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const signature = await tip(recipientWallet, parseFloat(amount));
      setTxSignature(signature);
      onSuccess?.(parseFloat(amount), signature);
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
    setAmount('');
    setTxSignature(null);
    setError(null);
  };

  if (!recipientWallet) return null;

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white text-sm rounded-lg transition-all"
      >
        <Wallet className="w-4 h-4" />
        <span>Tip</span>
      </motion.button>

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
                    {txSignature ? 'Tip Sent!' : `Tip ${recipientName || 'Assistant'}`}
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
                      <p className="text-gray-400 mb-4">Phantom wallet is required to send tips</p>
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
                      <p className="text-gray-400 mb-4">Connect your wallet to send a tip</p>
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
                        {amount} SOL sent successfully!
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
                    // Tip form
                    <div className="space-y-4">
                      {/* Wallet info */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Your wallet</span>
                        <span className="text-white font-mono">{formatAddress(4)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Balance</span>
                        <span className="text-white">{balance.toFixed(4)} SOL</span>
                      </div>

                      {/* Preset amounts */}
                      <div className="grid grid-cols-4 gap-2">
                        {presetAmounts.map((preset) => (
                          <button
                            key={preset}
                            onClick={() => setAmount(preset.toString())}
                            className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                              amount === preset.toString()
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                            }`}
                          >
                            {preset} SOL
                          </button>
                        ))}
                      </div>

                      {/* Custom amount */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Custom amount</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">SOL</span>
                        </div>
                      </div>

                      {/* Error */}
                      {error && (
                        <p className="text-red-400 text-sm text-center">{error}</p>
                      )}

                      {/* Send button */}
                      <button
                        onClick={handleTip}
                        disabled={isProcessing || !amount}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Send Tip
                          </>
                        )}
                      </button>
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

export default TipButton;
