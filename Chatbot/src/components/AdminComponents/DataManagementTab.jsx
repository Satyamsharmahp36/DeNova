import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Calendar, Save, X, RefreshCw, FileText, Briefcase } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAppContext } from '../../Appcontext';

const DataManagementTab = ({ 
  promptContent, 
  setPromptContent, 
  updatePrompt, 
  clearPrompt, 
  isLoading,
  responseStyleContent,
  setResponseStyleContent,
  updateResponseStyle,
  clearResponseStyle
}) => {
  const { userData, refreshUserData } = useAppContext();
  const [dailyTasks, setDailyTasks] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [updatingWorkflow, setUpdatingWorkflow] = useState(false);

  useEffect(() => {
    fetchDailyTasks();
  }, [userData]);

  const fetchDailyTasks = async () => {
    if (!userData || !userData.user || !userData.user.username) return;
    
    setLoadingWorkflow(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND}/daily-tasks/${userData.user.username}`);
      if (!response.ok) throw new Error('Failed to fetch daily tasks');
      
      const data = await response.json();
      setDailyTasks(data.content);
      setLastUpdated(data.lastUpdated);
    } catch (error) {
      console.error('Error fetching daily tasks:', error);
    } finally {
      setLoadingWorkflow(false);
    }
  };
  
  const updateDailyTasks = async () => {
    if (!userData || !userData.user || !userData.user.username) return;
    
    setUpdatingWorkflow(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND}/update-daily-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: dailyTasks,
          username: userData.user.username
        })
      });
      
      if (!response.ok) throw new Error('Failed to update daily tasks');
      
      const data = await response.json();
      setLastUpdated(data.dailyTasks.lastUpdated);
      await refreshUserData();
      toast.success('Daily workflow updated successfully');
    } catch (error) {
      console.error('Error updating daily tasks:', error);
      toast.error('Failed to update daily workflow');
    } finally {
      setUpdatingWorkflow(false);
    }
  };

  const handleUpdate = async () => {
    await updatePrompt();
    await refreshUserData();
  };

  const handleClear = async () => {
    await clearPrompt();
    await refreshUserData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not updated yet';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-240px)]">
      {/* Left Column - Knowledge Base (Full Height) */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Knowledge Base</h3>
                <p className="text-sm text-gray-400">Add information for your AI</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 flex-1 flex flex-col overflow-hidden min-h-0">
          <textarea
            value={promptContent}
            onChange={(e) => setPromptContent(e.target.value)}
            className="flex-1 min-h-[500px] p-4 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg resize-none border border-gray-700 hover:border-gray-600 transition-colors"
            placeholder="Enter facts, information, or context that your AI should know (e.g., your background, expertise, company info, FAQs, etc.)..."
            disabled={isLoading}
          />
          <div className="mt-2 text-xs text-gray-400">
            {promptContent.length} characters
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleUpdate}
            disabled={isLoading}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            <Save className="w-5 h-5" />
            <span>{isLoading ? 'Saving...' : 'Save'}</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleClear}
            disabled={isLoading}
            className="py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            <X className="w-5 h-5" />
            <span>Clear</span>
          </motion.button>
        </div>
      </div>

      {/* Right Column - Daily Workflow and Response Style (Stacked) */}
      <div className="flex flex-col gap-6">
        {/* Daily Workflow Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden flex flex-col flex-1">
          <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Daily Workflow</h3>
                  <p className="text-sm text-gray-400">Your schedule and daily tasks</p>
                </div>
              </div>
              <button
                onClick={fetchDailyTasks}
                disabled={loadingWorkflow}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Refresh workflow"
              >
                <RefreshCw className={`w-4 h-4 text-gray-400 ${loadingWorkflow ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col overflow-hidden">
            {loadingWorkflow ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
            ) : (
              <>
                <textarea
                  value={dailyTasks}
                  onChange={(e) => setDailyTasks(e.target.value)}
                  className="flex-1 p-4 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg resize-none border border-gray-700 hover:border-gray-600 transition-colors"
                  placeholder="Enter your daily tasks, schedule, and workflow (e.g., meetings, deadlines, priorities, etc.)..."
                  disabled={updatingWorkflow}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                  <span>{dailyTasks.length} characters</span>
                  <span>Updated: {formatDate(lastUpdated)}</span>
                </div>
              </>
            )}
          </div>

          <div className="px-6 pb-6 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={updateDailyTasks}
              disabled={updatingWorkflow || loadingWorkflow}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>{updatingWorkflow ? 'Updating...' : 'Update Workflow'}</span>
            </motion.button>
          </div>
        </div>

        {/* Response Style Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden flex flex-col flex-1">
          <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Response Style</h3>
                  <p className="text-sm text-gray-400">Customize AI tone and behavior</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col overflow-hidden">
            <textarea
              value={responseStyleContent || ''}
              onChange={(e) => setResponseStyleContent(e.target.value)}
              className="flex-1 p-4 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg resize-none border border-gray-700 hover:border-gray-600 transition-colors"
              placeholder="Define how your AI should respond (e.g., professional, concise, technical...)..."
              disabled={isLoading}
            />
            <div className="mt-2 text-xs text-gray-400">
              {(responseStyleContent || '').length} characters
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-3 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={updateResponseStyle}
              disabled={isLoading}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>{isLoading ? 'Saving...' : 'Save Style'}</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={clearResponseStyle}
              disabled={isLoading}
              className="py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              <X className="w-5 h-5" />
              <span>Clear</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagementTab;