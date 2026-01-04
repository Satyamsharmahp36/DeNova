import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Loader2, CheckCircle, RefreshCw, Copy, ExternalLink, Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const PROVIDERS = [
  { id: 'LINKEDIN', name: 'LinkedIn', icon: '💼', color: 'bg-blue-600' },
  { id: 'WHATSAPP', name: 'WhatsApp', icon: '💬', color: 'bg-green-500' },
  { id: 'GOOGLE', name: 'Gmail', icon: '📧', color: 'bg-red-500' },
  { id: 'OUTLOOK', name: 'Outlook', icon: '📬', color: 'bg-blue-500' },
  { id: 'INSTAGRAM', name: 'Instagram', icon: '📸', color: 'bg-pink-500' },
  { id: 'TELEGRAM', name: 'Telegram', icon: '✈️', color: 'bg-sky-500' },
];

const AddIntegrationDashboard = ({ isOpen, onClose }) => {
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [authUrl, setAuthUrl] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchConnectedAccounts();
      
      const handleMessage = (event) => {
        if (event.data.type === 'UNIPILE_AUTH_SUCCESS') {
          toast.success('Account connected!');
          fetchConnectedAccounts();
          setAuthUrl(null);
        } else if (event.data.type === 'UNIPILE_AUTH_FAILURE') {
          toast.error('Connection failed');
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
      toast.error('Select at least one provider');
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
        toast.success('Auth link generated!');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate link. Check Unipile service on port 9500.');
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
    toast.success('Copied!');
  };

  const handleDisconnect = async (accountId) => {
    try {
      await axios.delete(`http://localhost:9500/api/accounts/${accountId}`);
      toast.success('Account disconnected');
      fetchConnectedAccounts();
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2.5 rounded-lg">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Add Integration</h2>
              <p className="text-gray-400 text-sm">Connect your accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* Connected Accounts */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-white">Connected Accounts</h3>
                <button
                  onClick={fetchConnectedAccounts}
                  disabled={isLoadingAccounts}
                  className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingAccounts ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {isLoadingAccounts ? (
                <div className="flex items-center justify-center py-8 bg-gray-800 rounded-lg border border-gray-700">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : connectedAccounts.length > 0 ? (
                <div className="space-y-4">
                  {connectedAccounts.map((account) => (
                    <div key={account.accountId} className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">
                              {account.type === 'LINKEDIN' ? '💼' : 
                               account.type === 'WHATSAPP' ? '💬' : 
                               account.type === 'GOOGLE' ? '📧' : 
                               account.type === 'OUTLOOK' ? '📬' : '🔗'}
                            </span>
                            <span className="font-semibold text-white text-lg">{account.type || account.provider}</span>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              account.status === 'OK' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                            }`}>
                              {account.status}
                            </span>
                          </div>
                          <p className="text-base text-gray-300 mt-1">{account.name || account.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowAccountDetails(showAccountDetails === account.accountId ? null : account.accountId)}
                            className="text-sm px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                          >
                            {showAccountDetails === account.accountId ? 'Hide' : 'Details'}
                          </button>
                          <button
                            onClick={() => handleDisconnect(account.accountId)}
                            className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      {showAccountDetails === account.accountId && (
                        <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Account ID:</span>
                              <div className="flex items-center gap-2">
                                <code className="text-green-400 bg-gray-800 px-2 py-1 rounded text-xs font-mono">
                                  {account.accountId}
                                </code>
                                <button 
                                  onClick={() => copyToClipboard(account.accountId)} 
                                  className="text-gray-400 hover:text-white"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            {account.email && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Email:</span>
                                <span className="text-white">{account.email}</span>
                              </div>
                            )}
                            <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700">
                              <p className="text-xs text-gray-500 mb-1">Use in .env:</p>
                              <code className="text-xs text-yellow-400 font-mono">
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
                <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-gray-400">No accounts connected</p>
                </div>
              )}
            </div>

            {/* Add New Integration */}
            <div className="max-w-3xl mx-auto">
              <h3 className="text-lg font-medium text-white mb-4 text-center">Add New Integration</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => toggleProvider(provider.id)}
                    className={`relative p-3 rounded-lg border-2 transition-all ${
                      selectedProviders.includes(provider.id)
                        ? 'border-purple-500 bg-purple-900/30'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{provider.icon}</span>
                      <span className="font-medium text-white text-sm">{provider.name}</span>
                    </div>
                    {selectedProviders.includes(provider.id) && (
                      <CheckCircle className="w-4 h-4 text-purple-400 absolute top-2 right-2" />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerateAuthLink}
                disabled={isGenerating || selectedProviders.length === 0}
                className="w-full px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Generate Auth Link ({selectedProviders.length})
                  </>
                )}
              </button>

              {authUrl && (
                <div className="mt-4 p-4 bg-gray-800 border border-green-600 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-green-400">Auth Link Ready</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={openAuthPopup}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Connect Account
                    </button>
                    <button
                      onClick={() => copyToClipboard(authUrl)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddIntegrationDashboard;
