import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  MessageCircle,
  Linkedin,
  Twitter,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Shield,
  ChevronDown,
  ChevronUp,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const BACKEND_API = import.meta.env.VITE_BACKEND || 'http://localhost:5000';

const AIActionLogs = ({ username, isOwner = false }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const [expandedLog, setExpandedLog] = useState(null);

  useEffect(() => {
    if (username) {
      fetchLogs();
    }
  }, [username, filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: 100 });
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await axios.get(
        `${BACKEND_API}/ai-actions/logs/${username}?${params.toString()}`
      );

      if (response.data.success) {
        setLogs(response.data.data);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load action logs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!confirm('Delete this action log?')) return;

    try {
      const response = await axios.delete(`${BACKEND_API}/ai-actions/log/${logId}`);
      if (response.data.success) {
        toast.success('Log deleted');
        fetchLogs();
      }
    } catch (error) {
      console.error('Error deleting log:', error);
      toast.error('Failed to delete log');
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'WHATSAPP_SEND_MESSAGE':
        return <MessageCircle className="w-5 h-5" />;
      case 'LINKEDIN_POST':
        return <Linkedin className="w-5 h-5" />;
      case 'TWITTER_POST':
        return <Twitter className="w-5 h-5" />;
      case 'EMAIL_SEND':
        return <Mail className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'WHATSAPP_SEND_MESSAGE':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'LINKEDIN_POST':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'TWITTER_POST':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'EMAIL_SEND':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'executed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'approved':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'executed':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'approved':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const formatActionType = (type) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
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
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            AI Action Logs
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Track all AI-powered actions with wallet signature verification
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total || 0, color: 'text-gray-400' },
          { label: 'Executed', value: stats.executed || 0, color: 'text-green-400' },
          { label: 'Approved', value: stats.approved || 0, color: 'text-blue-400' },
          { label: 'Pending', value: stats.pending || 0, color: 'text-yellow-400' },
          { label: 'Failed', value: stats.failed || 0, color: 'text-red-400' }
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'executed', 'approved', 'pending', 'failed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === status
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Logs List */}
      {logs.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
          <Activity className="w-14 h-14 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">No action logs found</p>
          <p className="text-gray-500 text-sm mt-1">
            AI actions will appear here once executed
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <motion.div
              key={log._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors"
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-lg border ${getActionColor(log.actionType)}`}>
                    {getActionIcon(log.actionType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="text-white font-medium">
                          {formatActionType(log.actionType)}
                        </h3>
                        {log.actionDetails?.recipient && (
                          <p className="text-gray-400 text-sm mt-1">
                            To: {log.actionDetails.recipient}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium border flex items-center gap-1 ${getStatusColor(log.status)}`}>
                          {getStatusIcon(log.status)}
                          {log.status}
                        </span>
                      </div>
                    </div>

                    {log.actionDetails?.content && (
                      <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                        {log.actionDetails.content}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(log.createdAt)}
                      </span>
                      {log.walletSignature?.publicKey && (
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Signed
                        </span>
                      )}
                      {log.executionResult?.executedAt && (
                        <span>
                          Executed {formatDate(log.executionResult.executedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      title="View Details"
                    >
                      {expandedLog === log._id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteLog(log._id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedLog === log._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pt-4 border-t border-gray-700"
                    >
                      <div className="space-y-3 text-sm">
                        {/* Full Content */}
                        {log.actionDetails?.content && (
                          <div>
                            <div className="text-gray-400 font-medium mb-1">Content:</div>
                            <div className="bg-gray-900 rounded p-3 text-gray-300">
                              {log.actionDetails.content}
                            </div>
                          </div>
                        )}

                        {/* Wallet Signature */}
                        {log.walletSignature && (
                          <div>
                            <div className="text-gray-400 font-medium mb-1 flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Wallet Signature:
                            </div>
                            <div className="bg-gray-900 rounded p-3 space-y-2">
                              {log.walletSignature.publicKey && (
                                <div>
                                  <span className="text-gray-500">Public Key: </span>
                                  <span className="text-gray-300 font-mono text-xs">
                                    {log.walletSignature.publicKey.slice(0, 20)}...
                                  </span>
                                </div>
                              )}
                              {log.walletSignature.timestamp && (
                                <div>
                                  <span className="text-gray-500">Signed: </span>
                                  <span className="text-gray-300">
                                    {new Date(log.walletSignature.timestamp).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Execution Result */}
                        {log.executionResult && (
                          <div>
                            <div className="text-gray-400 font-medium mb-1">Execution Result:</div>
                            <div className={`rounded p-3 ${
                              log.executionResult.success 
                                ? 'bg-green-500/10 border border-green-500/20' 
                                : 'bg-red-500/10 border border-red-500/20'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                {log.executionResult.success ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                )}
                                <span className={log.executionResult.success ? 'text-green-400' : 'text-red-400'}>
                                  {log.executionResult.success ? 'Success' : 'Failed'}
                                </span>
                              </div>
                              {log.executionResult.message && (
                                <p className="text-gray-300 text-sm">{log.executionResult.message}</p>
                              )}
                              {log.executionResult.errorDetails && (
                                <p className="text-red-400 text-sm mt-2">{log.executionResult.errorDetails}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        {log.actionDetails?.metadata && Object.keys(log.actionDetails.metadata).length > 0 && (
                          <div>
                            <div className="text-gray-400 font-medium mb-1">Additional Info:</div>
                            <div className="bg-gray-900 rounded p-3">
                              <pre className="text-gray-300 text-xs overflow-x-auto">
                                {JSON.stringify(log.actionDetails.metadata, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIActionLogs;
