import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Mail, RefreshCw, Sparkles, Inbox, AlertCircle, Loader2, TrendingUp, CheckCircle, List } from 'lucide-react';

const EmailCatchup = ({ isOpen, onClose }) => {
    const [catchupData, setCatchupData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAllEmails, setShowAllEmails] = useState(false);

    const EMAIL_API_BASE = import.meta.env.VITE_EMAIL_API_BASE || 'http://localhost:3000';

    useEffect(() => {
        if (isOpen) {
            fetchEmailCatchup();
        }
    }, [isOpen]);

    const fetchEmailCatchup = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${EMAIL_API_BASE}/api/emails/catchup`);
            if (response.data.success) {
                setCatchupData(response.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch email catchup');
            console.error('Error fetching email catchup:', err);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700 border-red-300';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            default: return 'bg-blue-100 text-blue-700 border-blue-300';
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-8 h-8" />
                        <div>
                            <h2 className="text-2xl font-bold">AI Email Catchup</h2>
                            <p className="text-purple-100 text-sm">
                                Smart analysis of your recent emails
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Action Bar */}
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <button
                        onClick={fetchEmailCatchup}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Analysis
                    </button>
                    
                    {/* Toggle Switch for All Emails */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Show All Emails</span>
                        <button
                            onClick={() => setShowAllEmails(!showAllEmails)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                showAllEmails ? 'bg-purple-600' : 'bg-gray-300'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    showAllEmails ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                        <List className="w-5 h-5 text-gray-600" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading && !catchupData ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-3" />
                                <p className="text-gray-600">Analyzing your emails with AI...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-64 text-red-600">
                            <div className="text-center">
                                <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                                <p className="font-semibold">{error}</p>
                            </div>
                        </div>
                    ) : catchupData ? (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Mail className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-900">Email Accounts</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600">{catchupData.totalAccounts}</p>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Inbox className="w-5 h-5 text-purple-600" />
                                        <span className="text-sm font-medium text-purple-900">Total Analyzed</span>
                                    </div>
                                    <p className="text-2xl font-bold text-purple-600">{catchupData.totalEmails}</p>
                                </div>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                                        <span className="text-sm font-medium text-yellow-900">Unread</span>
                                    </div>
                                    <p className="text-2xl font-bold text-yellow-600">{catchupData.unreadCount}</p>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                        <span className="text-sm font-medium text-green-900">Important</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600">{catchupData.importantCount}</p>
                                </div>
                            </div>

                            {/* Connected Accounts */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Mail className="w-5 h-5" />
                                    Connected Email Accounts
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {catchupData.accounts.map((account) => (
                                        <div
                                            key={account.id}
                                            className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            <span className="font-medium">{account.email}</span>
                                            <span className="text-gray-500">({account.type})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* AI Insight */}
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-semibold text-purple-900 mb-2">AI Insight</h3>
                                        <p className="text-purple-800 text-lg">{catchupData.overallInsight}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            {catchupData.summary && (
                                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                        <Mail className="w-5 h-5" />
                                        Summary
                                    </h3>
                                    <p className="text-blue-800 leading-relaxed">{catchupData.summary}</p>
                                </div>
                            )}

                            {/* Toggle between Important and All Emails */}
                            {showAllEmails ? (
                                /* All Raw Emails Section */
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <List className="w-5 h-5 text-blue-600" />
                                        All Emails ({catchupData.allEmails?.length || catchupData.totalEmails})
                                    </h3>
                                    <div className="space-y-3">
                                        {catchupData.allEmails && catchupData.allEmails.length > 0 ? (
                                            /* Show all emails from the analyzed set */
                                            <>
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                                    <p className="text-sm text-blue-800">
                                                        Showing all {catchupData.allEmails.length} analyzed emails
                                                    </p>
                                                </div>
                                                {catchupData.allEmails.map((email, index) => (
                                                    <div
                                                        key={email.id || index}
                                                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-semibold text-gray-900">
                                                                        {email.from}
                                                                    </span>
                                                                    {email.isUnread && (
                                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                                                            Unread
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h4 className="font-semibold text-gray-800 mb-1">
                                                                    {email.subject || '(No Subject)'}
                                                                </h4>
                                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                                    {email.preview}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2 ml-4">
                                                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                                                    {formatDate(email.date)}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {email.accountEmail}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="text-center py-12">
                                                <Inbox className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                                                <p className="text-lg font-semibold text-gray-600">No emails found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Important Emails Section (Default) */
                                catchupData.importantEmails && catchupData.importantEmails.length > 0 ? (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-green-600" />
                                            Important Emails ({catchupData.importantCount})
                                        </h3>
                                        <div className="space-y-3">
                                            {catchupData.importantEmails.map((email, index) => (
                                            <div
                                                key={email.id || index}
                                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold text-gray-900">
                                                                {email.from}
                                                            </span>
                                                            {email.isUnread && (
                                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                                                    Unread
                                                                </span>
                                                            )}
                                                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium border ${getPriorityColor(email.aiPriority)}`}>
                                                                {email.aiPriority || 'medium'}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-semibold text-gray-800 mb-1">
                                                            {email.subject || '(No Subject)'}
                                                        </h4>
                                                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                                            {email.preview}
                                                        </p>
                                                        {email.aiReason && (
                                                            <div className="flex items-start gap-2 mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                                                                <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                                                <p className="text-sm text-purple-800">
                                                                    <strong>AI:</strong> {email.aiReason}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2 ml-4">
                                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                                            {formatDate(email.date)}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {email.accountEmail}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Inbox className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                                        <p className="text-lg font-semibold text-gray-600">No important emails found</p>
                                        <p className="text-sm text-gray-500">You're all caught up! 🎉</p>
                                    </div>
                                )
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default EmailCatchup;
