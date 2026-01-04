import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, Mail, RefreshCw, Sparkles, Inbox, AlertCircle, Loader2, 
  TrendingUp, CheckCircle, List, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';

const EMAIL_API_BASE = import.meta.env.VITE_EMAIL_API_BASE || 'http://localhost:3000';

const EmailCatchupDashboard = ({ isOpen, onClose }) => {
  const [catchupData, setCatchupData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAllEmails, setShowAllEmails] = useState(false);
  const [activeTab, setActiveTab] = useState('important');

  const fetchEmailCatchup = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${EMAIL_API_BASE}/api/emails/catchup`);
      if (response.data.success) {
        setCatchupData(response.data.data);
        toast.success('Email analysis complete!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch emails');
      console.error('Error fetching email catchup:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-yellow-600';
      default: return 'bg-blue-600';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gray-800 border-b border-gray-700 p-5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-lg">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Smart Email Catchup</h2>
                <p className="text-gray-400 text-sm">AI-powered email analysis</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center flex-shrink-0">
            <button
              onClick={fetchEmailCatchup}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Analyzing...' : 'Fetch & Analyze Emails'}
            </button>
            
            {catchupData && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">Show All</span>
                <button
                  onClick={() => setShowAllEmails(!showAllEmails)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showAllEmails ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showAllEmails ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-3" />
                  <p className="text-gray-400">Analyzing emails with AI...</p>
                </div>
              </div>
            ) : !catchupData ? (
              <div className="text-center py-20">
                <Mail className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-medium text-white mb-2">Ready to analyze your emails</h3>
                <p className="text-gray-400 mb-6">Click "Fetch & Analyze Emails" to get started</p>
                <button
                  onClick={fetchEmailCatchup}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Start Analysis
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-400">Accounts</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{catchupData.totalAccounts}</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Inbox className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-400">Analyzed</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{catchupData.totalEmails}</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-400">Unread</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-500">{catchupData.unreadCount}</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-400">Important</span>
                    </div>
                    <p className="text-2xl font-bold text-green-500">{catchupData.importantCount}</p>
                  </div>
                </div>

                {/* Connected Accounts */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Connected Accounts
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {catchupData.accounts.map((account) => (
                      <div
                        key={account.id}
                        className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm flex items-center gap-2"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-white">{account.email}</span>
                        <span className="text-gray-400 text-xs">({account.type})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insight */}
                <div className="bg-gray-800 border border-blue-700 rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-2">AI Insight</h3>
                      <p className="text-gray-200 leading-relaxed">{catchupData.overallInsight}</p>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {catchupData.summary && (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
                    <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                      <List className="w-4 h-4" />
                      Summary
                    </h3>
                    <p className="text-gray-300 leading-relaxed">{catchupData.summary}</p>
                  </div>
                )}

                {/* Emails List */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    {showAllEmails ? (
                      <>
                        <List className="w-5 h-5 text-gray-400" />
                        All Emails ({catchupData.allEmails?.length || catchupData.totalEmails})
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        Important Emails ({catchupData.importantCount})
                      </>
                    )}
                  </h3>
                  
                  <div className="space-y-3">
                    {showAllEmails ? (
                      catchupData.allEmails && catchupData.allEmails.length > 0 ? (
                        catchupData.allEmails.map((email, index) => (
                          <div
                            key={email.id || index}
                            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-medium text-white">
                                    {email.from}
                                  </span>
                                  {email.isUnread && (
                                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded font-medium">
                                      Unread
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-medium text-gray-200 mb-1">
                                  {email.subject || '(No Subject)'}
                                </h4>
                                <p className="text-sm text-gray-400 line-clamp-2">
                                  {email.preview}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1 ml-4">
                                <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(email.date)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {email.accountEmail}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                          <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                          <p className="text-gray-400">No emails found</p>
                        </div>
                      )
                    ) : (
                      catchupData.importantEmails && catchupData.importantEmails.length > 0 ? (
                        catchupData.importantEmails.map((email, index) => (
                          <div
                            key={email.id || index}
                            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-medium text-white">
                                    {email.from}
                                  </span>
                                  {email.isUnread && (
                                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded font-medium">
                                      Unread
                                    </span>
                                  )}
                                  <span className={`w-2 h-2 rounded-full ${getPriorityColor(email.aiPriority)}`}></span>
                                  <span className="text-xs text-gray-400 uppercase">
                                    {email.aiPriority || 'medium'}
                                  </span>
                                </div>
                                <h4 className="font-medium text-gray-200 mb-1">
                                  {email.subject || '(No Subject)'}
                                </h4>
                                <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                                  {email.preview}
                                </p>
                                {email.aiReason && (
                                  <div className="flex items-start gap-2 p-3 bg-gray-900 rounded-lg border border-gray-700">
                                    <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-300">
                                      {email.aiReason}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1 ml-4">
                                <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(email.date)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {email.accountEmail}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                          <p className="text-lg font-medium text-white mb-1">All caught up!</p>
                          <p className="text-sm text-gray-400">No important emails found 🎉</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EmailCatchupDashboard;
