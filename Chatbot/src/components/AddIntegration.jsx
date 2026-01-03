import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2, CheckCircle, AlertCircle, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const PROVIDERS = [
  { id: 'LINKEDIN', name: 'LinkedIn', icon: '💼', color: 'bg-blue-600', description: 'Connect your LinkedIn account for posting and messaging' },
  { id: 'WHATSAPP', name: 'WhatsApp', icon: '💬', color: 'bg-green-500', description: 'Connect WhatsApp for messaging integration' },
  { id: 'GOOGLE', name: 'Google (Gmail)', icon: '📧', color: 'bg-red-500', description: 'Connect Gmail for email integration' },
  { id: 'OUTLOOK', name: 'Outlook', icon: '📬', color: 'bg-blue-500', description: 'Connect Outlook/Microsoft email' },
  { id: 'INSTAGRAM', name: 'Instagram', icon: '📸', color: 'bg-pink-500', description: 'Connect Instagram for messaging' },
  { id: 'TELEGRAM', name: 'Telegram', icon: '✈️', color: 'bg-sky-500', description: 'Connect Telegram for messaging' },
];

const AddIntegration = ({ isOpen, onClose }) => {
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [authUrl, setAuthUrl] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchConnectedAccounts();
      
      // Listen for auth success message from popup
      const handleMessage = (event) => {
        if (event.data.type === 'UNIPILE_AUTH_SUCCESS') {
          toast.success('Account connected successfully!');
          fetchConnectedAccounts();
          setAuthUrl(null);
        } else if (event.data.type === 'UNIPILE_AUTH_FAILURE') {
          toast.error('Account connection failed');
          setAuthUrl(null);
        }
      };
      
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [isOpen]);

  const fetchConnectedAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const response = await axios.get('http://localhost:9500/api/accounts');
      if (response.data.success) {
        setConnectedAccounts(response.data.data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const toggleProvider = (providerId) => {
    setSelectedProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(p => p !== providerId)
        : [...prev, providerId]
    );
  };

  const handleGenerateAuthLink = async () => {
    if (selectedProviders.length === 0) {
      toast.error('Please select at least one provider');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post('http://localhost:9500/api/auth/link', {
        providers: selectedProviders,
        userId: `user_${Date.now()}`,
        successUrl: 'http://localhost:9500/api/auth/success',
        failureUrl: 'http://localhost:9500/api/auth/failure'
      });

      if (response.data.success) {
        setAuthUrl(response.data.data.authUrl);
        toast.success('Auth link generated! Click to connect your account.');
      }
    } catch (error) {
      console.error('Error generating auth link:', error);
      toast.error('Failed to generate auth link. Make sure Unipile service is running on port 9500.');
    } finally {
      setIsGenerating(false);
    }
  };

  const openAuthPopup = () => {
    if (authUrl) {
      window.open(authUrl, 'UnipileAuth', 'width=600,height=700,scrollbars=yes');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleDisconnect = async (accountId) => {
    try {
      await axios.delete(`http://localhost:9500/api/accounts/${accountId}`);
      toast.success('Account disconnected');
      fetchConnectedAccounts();
    } catch (error) {
      toast.error('Failed to disconnect account');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Plus className="w-6 h-6 text-purple-400" />
            Add Integration
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Connected Accounts Section */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Connected Accounts</h3>
              <button
                onClick={fetchConnectedAccounts}
                disabled={isLoadingAccounts}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${isLoadingAccounts ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {isLoadingAccounts ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            ) : connectedAccounts.length > 0 ? (
              <div className="space-y-3">
                {connectedAccounts.map((account) => (
                  <div key={account.accountId} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {account.type === 'LINKEDIN' ? '💼' : 
                             account.type === 'WHATSAPP' ? '💬' : 
                             account.type === 'GOOGLE' ? '📧' : 
                             account.type === 'OUTLOOK' ? '📬' : '🔗'}
                          </span>
                          <span className="font-medium text-white">{account.type || account.provider}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            account.status === 'OK' ? 'bg-green-600' : 'bg-yellow-600'
                          }`}>
                            {account.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{account.name || account.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowAccountDetails(showAccountDetails === account.accountId ? null : account.accountId)}
                          className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
                        >
                          {showAccountDetails === account.accountId ? 'Hide' : 'Show'} Details
                        </button>
                        <button
                          onClick={() => handleDisconnect(account.accountId)}
                          className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                    
                    {/* Account Details Popup */}
                    {showAccountDetails === account.accountId && (
                      <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-600">
                        <h4 className="text-sm font-semibold text-purple-400 mb-2">Account Details & API Keys</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Account ID:</span>
                            <div className="flex items-center gap-2">
                              <code className="text-green-400 bg-gray-900 px-2 py-1 rounded text-xs">{account.accountId}</code>
                              <button onClick={() => copyToClipboard(account.accountId)} className="text-gray-400 hover:text-white">
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Type:</span>
                            <span className="text-white">{account.type || account.provider}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Status:</span>
                            <span className={account.status === 'OK' ? 'text-green-400' : 'text-yellow-400'}>{account.status}</span>
                          </div>
                          {account.email && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Email:</span>
                              <span className="text-white">{account.email}</span>
                            </div>
                          )}
                          <div className="mt-3 p-2 bg-gray-900 rounded border border-gray-700">
                            <p className="text-xs text-gray-500 mb-1">Use this Account ID in your .env file:</p>
                            <code className="text-xs text-yellow-400">
                              {account.type}_ACCOUNT_ID={account.accountId}
                            </code>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">No accounts connected yet</p>
            )}
          </div>

          {/* Add New Integration Section */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Add New Integration</h3>
            
            {/* Provider Selection */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => toggleProvider(provider.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedProviders.includes(provider.id)
                      ? 'border-purple-500 bg-purple-900/30'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{provider.icon}</span>
                    <div className="text-left">
                      <p className="font-medium text-white text-sm">{provider.name}</p>
                      <p className="text-xs text-gray-400">{provider.description.substring(0, 30)}...</p>
                    </div>
                  </div>
                  {selectedProviders.includes(provider.id) && (
                    <CheckCircle className="w-5 h-5 text-purple-400 absolute top-2 right-2" />
                  )}
                </button>
              ))}
            </div>

            {/* Generate Auth Link Button */}
            <button
              onClick={handleGenerateAuthLink}
              disabled={isGenerating || selectedProviders.length === 0}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Auth Link...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Generate Auth Link ({selectedProviders.length} selected)
                </>
              )}
            </button>

            {/* Auth URL Display */}
            {authUrl && (
              <div className="mt-4 p-4 bg-green-900/30 border border-green-600 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-green-400">Auth Link Generated!</span>
                </div>
                <p className="text-sm text-gray-300 mb-3">
                  Click the button below to open the authentication wizard in a new window.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={openAuthPopup}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Connect Account
                  </button>
                  <button
                    onClick={() => copyToClipboard(authUrl)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
            <p className="text-sm text-purple-300">
              💡 <strong>How it works:</strong> Select the services you want to connect, generate an auth link, 
              and complete the OAuth flow. Once connected, you'll see your Account IDs which can be used 
              in your application's .env file for API calls.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddIntegration;
