import React from 'react';
import { motion } from 'framer-motion';
import { User, RefreshCw, Filter, ChevronDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAppContext } from '../../Appcontext';

const ContributionsTab = ({
  contributions,
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
  refreshContributions,
  updateContributionStatus,
  refreshing
}) => {
  const { userData } = useAppContext();

  const handleFilterChange = (value) => {
    if (setStatusFilter) setStatusFilter(value);
  };

  const handleSortChange = (value) => {
    if (setSortOrder) setSortOrder(value);
  };

  if (!contributions) {
    return <div className="text-white p-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-white flex items-center">
          <User className="w-5 h-5 mr-2 text-emerald-400" />
          User Contributions ({contributions?.length || 0})
        </h3>
        
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <div className="flex items-center space-x-3 bg-gray-900 rounded-full px-4 py-2 border border-gray-700 hover:border-emerald-500 transition-colors cursor-pointer">
              <Filter className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
              <select
                value={statusFilter || ""}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="border-none p-1 text-center text-white bg-gray-800 rounded focus:outline-none text-sm font-medium cursor-pointer appearance-none w-full"
              >
                <option value="">All Contributions</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            </div>
          </div>
          
          <div className="relative group">
            <div className="flex items-center space-x-3 bg-gray-900 rounded-full px-4 py-2 border border-gray-700 hover:border-emerald-500 transition-colors cursor-pointer">
              <Clock className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
              <select
                value={sortOrder || "newest"}
                onChange={(e) => handleSortChange(e.target.value)}
                className="border-none p-1 text-center text-white bg-gray-800 rounded focus:outline-none text-sm font-medium cursor-pointer appearance-none w-full"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </div>   
      
      <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        {!contributions || contributions.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700">
            <motion.div 
              animate={{ 
                opacity: [0.5, 1, 0.5],
                scale: [0.98, 1, 0.98]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="flex justify-center mb-4"
            >
              <User className="w-16 h-16 text-gray-600" />
            </motion.div>
            <p className="text-gray-400 text-lg font-medium">No contributions found</p>
            <p className="text-gray-500 text-sm mt-2">User submissions will appear here</p>
          </div>
        ) : (
          contributions.map((contribution, index) => (
            <motion.div 
              key={contribution._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-all"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-800/80 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{contribution.name}</p>
                    <p className="text-xs text-gray-400">
                      {contribution.createdAt 
                        ? new Date(contribution.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Date not available'}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span 
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                      contribution.status === 'approved'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                        : contribution.status === 'rejected'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}
                  >
                    {contribution.status === 'approved' ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approved
                      </>
                    ) : contribution.status === 'rejected' ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        Rejected
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        Pending
                      </>
                    )}
                  </span>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="bg-emerald-500/5 border-l-4 border-emerald-500 rounded-r-lg p-3">
                  <div className="text-xs text-emerald-400 mb-2 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                    Question
                  </div>
                  <div className="text-white text-sm leading-relaxed break-words">{contribution.question}</div>
                </div>
                
                <div className="bg-green-500/5 border-l-4 border-green-500 rounded-r-lg p-3">
                  <div className="text-xs text-green-400 mb-2 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                    Contribution
                  </div>
                  <div className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words">{contribution.answer}</div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="p-3 bg-gray-900/50 border-t border-gray-700 flex justify-end gap-2">
                {contribution.status === 'pending' && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateContributionStatus(contribution._id, 'approved')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateContributionStatus(contribution._id, 'rejected')}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </motion.button>
                  </>
                )}
                
                {contribution.status !== 'pending' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateContributionStatus(contribution._id, 'pending')}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Reset to Pending
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContributionsTab;