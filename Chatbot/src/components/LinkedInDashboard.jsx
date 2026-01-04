import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, Send, Sparkles, Loader2, Calendar, Clock, Plus, Trash2, 
  RefreshCw, Linkedin, Edit3, Check, AlertCircle, Wallet, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useSolana } from '../hooks/useSolana';

const LINKEDIN_API_BASE = import.meta.env.VITE_LINKEDIN_API_BASE || 'http://localhost:4000';

const LinkedInDashboard = ({ isOpen, onClose }) => {
  const { isConnected, walletAddress, connect, signAction, formatAddress } = useSolana();
  const [activeTab, setActiveTab] = useState('post');
  const [topic, setTopic] = useState('');
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isSigningAction, setIsSigningAction] = useState(false);
  
  // Scheduling state
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    topic: '',
    frequency: 'daily',
    time: '09:00',
    aiEnhance: true,
    isActive: true
  });

  useEffect(() => {
    if (isOpen) {
      loadScheduledPosts();
    }
  }, [isOpen]);

  const loadScheduledPosts = async () => {
    try {
      const saved = localStorage.getItem('linkedin_scheduled_posts');
      if (saved) {
        setScheduledPosts(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading scheduled posts:', error);
    }
  };

  const saveScheduledPosts = (posts) => {
    localStorage.setItem('linkedin_scheduled_posts', JSON.stringify(posts));
    setScheduledPosts(posts);
  };

  const handleGeneratePost = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post(`${LINKEDIN_API_BASE}/api/ai/posts/generate`, {
        topic: topic,
        options: {
          tone: 'professional',
          length: 'medium',
          includeHashtags: true,
          includeEmojis: true
        }
      });

      if (response.data.success) {
        setGeneratedPost(response.data.data.content);
        toast.success('Post generated!');
      }
    } catch (error) {
      console.error('Error generating post:', error);
      toast.error('Failed to generate. Check if LinkedIn service is running.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostToLinkedIn = async () => {
    if (!generatedPost.trim()) {
      toast.error('No content to publish');
      return;
    }

    // Wallet signature gate for security
    if (!isConnected) {
      toast.error('Please connect your wallet to authorize this action');
      return;
    }
    
    setIsSigningAction(true);
    let signatureData = null;
    try {
      // Request wallet signature before posting
      signatureData = await signAction('LINKEDIN_POST', `Publishing post: "${generatedPost.substring(0, 50)}..."`);
      toast.success('Action authorized!');
    } catch (signError) {
      console.error('Signature rejected:', signError);
      toast.error('Action cancelled - wallet signature required');
      setIsSigningAction(false);
      return;
    }
    setIsSigningAction(false);

    setIsPosting(true);
    try {
      const response = await axios.post(`${LINKEDIN_API_BASE}/api/linkedin/posts/create`, {
        content: generatedPost,
        visibility: 'public'
      });

      if (response.data.success) {
        toast.success('Published to LinkedIn!');
        
        // Log the action
        try {
          await axios.post(`${import.meta.env.VITE_BACKEND}/ai-actions/log`, {
            username: walletAddress,
            actionType: 'LINKEDIN_POST',
            actionDetails: {
              content: generatedPost,
              platform: 'linkedin',
              metadata: { topic }
            },
            walletSignature: signatureData ? {
              signature: signatureData.signature,
              publicKey: signatureData.publicKey,
              message: signatureData.message,
              timestamp: new Date()
            } : null,
            status: 'executed',
            executionResult: {
              success: true,
              message: 'Post published to LinkedIn',
              executedAt: new Date()
            }
          });
        } catch (logError) {
          console.error('Failed to log action:', logError);
        }
        
        setGeneratedPost('');
        setTopic('');
      }
    } catch (error) {
      console.error('Error posting:', error);
      toast.error(error.response?.data?.message || 'Failed to post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleAddSchedule = () => {
    if (!scheduleForm.topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    const newSchedule = {
      id: Date.now().toString(),
      ...scheduleForm,
      createdAt: new Date().toISOString(),
      lastPosted: null
    };

    const updated = [...scheduledPosts, newSchedule];
    saveScheduledPosts(updated);
    setShowScheduleModal(false);
    setScheduleForm({
      topic: '',
      frequency: 'daily',
      time: '09:00',
      aiEnhance: true,
      isActive: true
    });
    toast.success('Schedule added!');
  };

  const handleRemoveSchedule = (id) => {
    const updated = scheduledPosts.filter(s => s.id !== id);
    saveScheduledPosts(updated);
    toast.success('Schedule removed');
  };

  const handleToggleSchedule = (id) => {
    const updated = scheduledPosts.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    );
    saveScheduledPosts(updated);
  };

  const handlePostScheduledNow = async (schedule) => {
    setIsPosting(true);
    try {
      // Generate AI post for the topic
      const genResponse = await axios.post(`${LINKEDIN_API_BASE}/api/ai/posts/generate`, {
        topic: schedule.topic,
        options: {
          tone: 'professional',
          length: 'medium',
          includeHashtags: true,
          includeEmojis: true
        }
      });

      if (genResponse.data.success) {
        // Post to LinkedIn
        const postResponse = await axios.post(`${LINKEDIN_API_BASE}/api/linkedin/posts/create`, {
          content: genResponse.data.data.content,
          visibility: 'public'
        });

        if (postResponse.data.success) {
          // Update last posted
          const updated = scheduledPosts.map(s => 
            s.id === schedule.id ? { ...s, lastPosted: new Date().toISOString() } : s
          );
          saveScheduledPosts(updated);
          toast.success('Posted successfully!');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to post');
    } finally {
      setIsPosting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gray-800 border-b border-gray-700 p-5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2.5 rounded-lg">
                <Linkedin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">LinkedIn Manager</h2>
                <p className="text-gray-400 text-sm">Create and schedule posts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
            <div className="flex px-6">
              {[
                { id: 'post', label: 'Create Post', icon: Edit3 },
                { id: 'schedule', label: 'Scheduled', icon: Calendar, count: scheduledPosts.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-3.5 px-5 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                        {tab.count}
                      </span>
                    )}
                  </div>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="linkedinActiveTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Create Post Tab */}
            {activeTab === 'post' && (
              <div className="space-y-5">
                {/* Topic Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Post Topic
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., AI innovations, Career tips, Industry insights..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleGeneratePost()}
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGeneratePost}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate with AI
                    </>
                  )}
                </button>

                {/* Generated Post */}
                {generatedPost && (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-300">
                      Generated Post
                    </label>
                    <textarea
                      value={generatedPost}
                      onChange={(e) => setGeneratedPost(e.target.value)}
                      rows={10}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 resize-none"
                    />

                    <button
                      onClick={handlePostToLinkedIn}
                      disabled={isPosting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isPosting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Publish to LinkedIn
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <div className="space-y-5">
                {/* Add Schedule Button */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-white">Scheduled Posts</h3>
                    <p className="text-gray-400 text-sm">AI generates unique posts each time</p>
                  </div>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Schedule
                  </button>
                </div>

                {/* Scheduled Posts List */}
                {scheduledPosts.length === 0 ? (
                  <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
                    <Calendar className="w-14 h-14 mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400">No scheduled posts</p>
                    <p className="text-gray-500 text-sm mt-1">Add a schedule to auto-post daily</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scheduledPosts.map((schedule) => (
                      <div
                        key={schedule.id}
                        className={`bg-gray-800 border rounded-lg p-4 ${
                          schedule.isActive ? 'border-gray-700' : 'border-gray-700 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-white font-medium">{schedule.topic}</h4>
                              {schedule.aiEnhance && (
                                <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded">
                                  AI Enhanced
                                </span>
                              )}
                              {!schedule.isActive && (
                                <span className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded">
                                  Paused
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {schedule.frequency} at {schedule.time}
                              </span>
                              {schedule.lastPosted && (
                                <span>
                                  Last: {new Date(schedule.lastPosted).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePostScheduledNow(schedule)}
                              disabled={isPosting}
                              className="text-emerald-400 hover:text-emerald-300 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                              title="Post Now"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleSchedule(schedule.id)}
                              className={`p-2 rounded-lg hover:bg-gray-700 transition-colors ${
                                schedule.isActive ? 'text-green-400' : 'text-gray-500'
                              }`}
                              title={schedule.isActive ? 'Pause' : 'Resume'}
                            >
                              {schedule.isActive ? <Check className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleRemoveSchedule(schedule.id)}
                              className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Info */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-400">
                      <p className="font-medium text-gray-300 mb-1">How it works</p>
                      <p>Each scheduled post uses AI to generate unique content based on your topic. Posts are different every time to keep your feed fresh and engaging.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showScheduleModal && ReactDOM.createPortal(
        <AnimatePresence>
          <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowScheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md"
            >
              <div className="bg-gray-800 border-b border-gray-700 p-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Add Schedule</h3>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Topic/Context</label>
                  <input
                    type="text"
                    value={scheduleForm.topic}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, topic: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., Tech industry trends"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
                    <select
                      value={scheduleForm.frequency}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="weekdays">Weekdays</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                    <input
                      type="time"
                      value={scheduleForm.time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input
                    type="checkbox"
                    checked={scheduleForm.aiEnhance}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, aiEnhance: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                  />
                  <span className="text-sm">AI Enhancement (unique posts each time)</span>
                </label>

                <button
                  onClick={handleAddSchedule}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Add Schedule
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default LinkedInDashboard;
