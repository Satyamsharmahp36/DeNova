import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Mail, RefreshCw, CheckCheck, Send, Loader2, Inbox, AlertCircle } from 'lucide-react';

const EmailIntegration = ({ isOpen, onClose }) => {
    const [unreadEmails, setUnreadEmails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [emailAccounts, setEmailAccounts] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [showCompose, setShowCompose] = useState(false);
    const [composeData, setComposeData] = useState({
        to: '',
        subject: '',
        body: '',
        accountId: ''
    });
    const [sendingEmail, setSendingEmail] = useState(false);

    const EMAIL_API_BASE = import.meta.env.VITE_EMAIL_API_BASE || 'http://localhost:3000';

    useEffect(() => {
        if (isOpen) {
            fetchEmailAccounts();
            fetchUnreadEmails();
        }
    }, [isOpen]);

    const fetchEmailAccounts = async () => {
        try {
            const response = await axios.get(`${EMAIL_API_BASE}/api/emails/accounts`);
            if (response.data.success) {
                setEmailAccounts(response.data.data);
                if (response.data.data.length > 0) {
                    setComposeData(prev => ({ ...prev, accountId: response.data.data[0].id }));
                }
            }
        } catch (err) {
            console.error('Failed to fetch email accounts:', err);
        }
    };

    const fetchUnreadEmails = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${EMAIL_API_BASE}/api/emails/unread/all?limit=20`);
            if (response.data.success) {
                setUnreadEmails(response.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch unread emails');
            console.error('Error fetching unread emails:', err);
        } finally {
            setLoading(false);
        }
    };

    const markEmailAsRead = async (emailId, accountId) => {
        try {
            await axios.patch(`${EMAIL_API_BASE}/api/emails/${accountId}/${emailId}/read`, {
                isRead: true
            });
            setUnreadEmails(prev => prev.filter(email => email.id !== emailId));
        } catch (err) {
            console.error('Failed to mark email as read:', err);
        }
    };

    const markAllAsRead = async () => {
        if (!window.confirm('Mark all emails as read across all accounts?')) return;
        
        setLoading(true);
        try {
            const response = await axios.post(`${EMAIL_API_BASE}/api/emails/mark-all-read`);
            if (response.data.success) {
                setUnreadEmails([]);
                alert(`✅ Marked ${response.data.data.totalMarked} emails as read!`);
            }
        } catch (err) {
            alert('Failed to mark all emails as read');
            console.error('Error marking all as read:', err);
        } finally {
            setLoading(false);
        }
    };

    const sendEmail = async () => {
        if (!composeData.to || !composeData.subject || !composeData.body) {
            alert('Please fill in all fields');
            return;
        }

        setSendingEmail(true);
        try {
            const response = await axios.post(
                `${EMAIL_API_BASE}/api/emails/${composeData.accountId}/send`,
                {
                    to: composeData.to,
                    subject: composeData.subject,
                    body: composeData.body,
                    isHtml: false
                }
            );

            if (response.data.success) {
                alert('✅ Email sent successfully!');
                setShowCompose(false);
                setComposeData({
                    to: '',
                    subject: '',
                    body: '',
                    accountId: emailAccounts[0]?.id || ''
                });
            }
        } catch (err) {
            alert('Failed to send email: ' + (err.response?.data?.message || err.message));
            console.error('Error sending email:', err);
        } finally {
            setSendingEmail(false);
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
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Mail className="w-8 h-8" />
                        <div>
                            <h2 className="text-2xl font-bold">Email Integration</h2>
                            <p className="text-blue-100 text-sm">
                                {emailAccounts.length} account{emailAccounts.length !== 1 ? 's' : ''} connected • {unreadEmails.length} unread
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

                {/* Action Buttons */}
                <div className="p-4 bg-gray-50 border-b flex gap-3 flex-wrap">
                    <button
                        onClick={fetchUnreadEmails}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={markAllAsRead}
                        disabled={loading || unreadEmails.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Mark All Read
                    </button>
                    <button
                        onClick={() => setShowCompose(!showCompose)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                        Compose Email
                    </button>
                </div>

                {/* Compose Email Section */}
                {showCompose && (
                    <div className="p-6 bg-blue-50 border-b">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Send className="w-5 h-5" />
                            Compose New Email
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">From Account</label>
                                <select
                                    value={composeData.accountId}
                                    onChange={(e) => setComposeData({ ...composeData, accountId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {emailAccounts.map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.email} ({account.type})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                                <input
                                    type="email"
                                    value={composeData.to}
                                    onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                                    placeholder="recipient@example.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={composeData.subject}
                                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                                    placeholder="Email subject"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea
                                    value={composeData.body}
                                    onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                                    placeholder="Write your email message..."
                                    rows={6}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={sendEmail}
                                    disabled={sendingEmail}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {sendingEmail ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send Email
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowCompose(false)}
                                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Email List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading && unreadEmails.length === 0 ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-64 text-red-600">
                            <div className="text-center">
                                <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                                <p className="font-semibold">{error}</p>
                            </div>
                        </div>
                    ) : unreadEmails.length === 0 ? (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            <div className="text-center">
                                <Inbox className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                                <p className="text-lg font-semibold">No unread emails</p>
                                <p className="text-sm">You're all caught up! 🎉</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {unreadEmails.map((email) => (
                                <div
                                    key={email.id}
                                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => setSelectedEmail(email)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-gray-900">
                                                    {email.fromName || email.from}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {email.accountEmail}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-gray-800 mb-1">
                                                {email.subject || '(No Subject)'}
                                            </h3>
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {email.preview}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 ml-4">
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {formatDate(email.date)}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markEmailAsRead(email.id, email.accountId);
                                                }}
                                                className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                                            >
                                                Mark Read
                                            </button>
                                        </div>
                                    </div>
                                    {email.hasAttachments && (
                                        <span className="inline-block text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                            📎 Has attachments
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Email Detail Modal */}
                {selectedEmail && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
                                <h3 className="font-semibold text-lg">{selectedEmail.subject || '(No Subject)'}</h3>
                                <button
                                    onClick={() => setSelectedEmail(null)}
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1">
                                <div className="mb-4 pb-4 border-b">
                                    <p className="text-sm text-gray-600">
                                        <strong>From:</strong> {selectedEmail.fromName} &lt;{selectedEmail.from}&gt;
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <strong>Date:</strong> {new Date(selectedEmail.date).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <strong>Account:</strong> {selectedEmail.accountEmail}
                                    </p>
                                </div>
                                <div className="prose max-w-none">
                                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                                        {selectedEmail.plainTextBody || selectedEmail.preview}
                                    </pre>
                                </div>
                            </div>
                            <div className="bg-gray-100 p-4 border-t flex gap-3">
                                <button
                                    onClick={() => {
                                        markEmailAsRead(selectedEmail.id, selectedEmail.accountId);
                                        setSelectedEmail(null);
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Mark as Read
                                </button>
                                <button
                                    onClick={() => setSelectedEmail(null)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailIntegration;
