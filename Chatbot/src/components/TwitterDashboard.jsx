import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, Send, Sparkles, Loader2, Calendar, Clock, Plus, Trash2, 
  RefreshCw, Twitter, Edit3, Check, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';

const TWITTER_API_BASE = import.meta.env.VITE_TWITTER_API_BASE || 'http://localhost:9000';

const TwitterDashboard = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('post');
  const [context, setContext] = useState('');
  const [generatedTweet, setGeneratedTweet] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  
  // Scheduling state
  const [scheduledTweets, setScheduledTweets] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    topic: '',
    frequency: 'daily',
    time: '10:00',
    aiEnhance: true,
    isActive: true
  });

  useEffect(() => {
    if (isOpen) {
      loadScheduledTweets();
    }
  }, [isOpen]);

  const loadScheduledTweets = async () => {
    try {
      const saved = localStorage.getItem('twitter_scheduled_tweets');
      if (saved) {
        setScheduledTweets(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading scheduled tweets:', error);
    }
  };

  const saveScheduledTweets = (tweets) => {
    localStorage.setItem('twitter_scheduled_tweets', JSON.stringify(tweets));
    setScheduledTweets(tweets);
  };

  const handleGenerateTweet = async () => {
    if (!context.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post(`${TWITTER_API_BASE}/api/ai/generate`, {
        context: context,
        options: {
          tone: 'engaging',
          includeHashtags: true,
          includeEmojis: true,
          maxLength: 280
        }
      });

      if (response.data.success) {
        setGeneratedTweet(response.data.data.content);
        setCharacterCount(response.data.data.characterCount || response.data.data.content.length);
        toast.success('Tweet generated!');
      }
    } catch (error) {
      console.error('Error generating tweet:', error);
      toast.error('Failed to generate. Check if Twitter service is running.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostToTwitter = async () => {
    if (!generatedTweet.trim()) {
      toast.error('No content to publish');
      return;
    }

    if (generatedTweet.length > 280) {
      toast.error('Tweet exceeds 280 characters');
      return;
    }

    setIsPosting(true);
    try {
      const response = await axios.post(`${TWITTER_API_BASE}/api/twitter/post`, {
        text: generatedTweet
      });

      if (response.data.success) {
        toast.success('Posted to Twitter/X!');
        setGeneratedTweet('');
        setContext('');
        setCharacterCount(0);
        
        if (response.data.data.url) {
          setTimeout(() => {
            toast.info(`View tweet: ${response.data.data.url}`, { autoClose: 8000 });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error posting:', error);
      toast.error(error.response?.data?.message || 'Failed to post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleTweetChange = (e) => {
    const text = e.target.value;
    if (text.length <= 280) {
      setGeneratedTweet(text);
      setCharacterCount(text.length);
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

    const updated = [...scheduledTweets, newSchedule];
    saveScheduledTweets(updated);
    setShowScheduleModal(false);
    setScheduleForm({
      topic: '',
      frequency: 'daily',
      time: '10:00',
      aiEnhance: true,
      isActive: true
    });
    toast.success('Schedule added!');
  };

  const handleRemoveSchedule = (id) => {
    const updated = scheduledTweets.filter(s => s.id !== id);
    saveScheduledTweets(updated);
    toast.success('Schedule removed');
  };

  const handleToggleSchedule = (id) => {
    const updated = scheduledTweets.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    );
    saveScheduledTweets(updated);
  };

  const handlePostScheduledNow = async (schedule) => {
    setIsPosting(true);
    try {
      // Generate AI tweet for the topic
      const genResponse = await axios.post(`${TWITTER_API_BASE}/api/ai/generate`, {
        context: schedule.topic,
        options: {
          tone: 'engaging',
          includeHashtags: true,
          includeEmojis: true,
          maxLength: 280
        }
      });

      if (genResponse.data.success) {
        // Post to Twitter
        const postResponse = await axios.post(`${TWITTER_API_BASE}/api/twitter/post`, {
          text: genResponse.data.data.content
        });

        if (postResponse.data.success) {
          // Update last posted
          const updated = scheduledTweets.map(s => 
            s.id === schedule.id ? { ...s, lastPosted: new Date().toISOString() } : s
          );
          saveScheduledTweets(updated);
          toast.success('Tweeted successfully!');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to tweet');
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
              <div className="bg-emerald-500 p-2.5 rounded-lg">
                <Twitter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Twitter/X Manager</h2>
                <p className="text-gray-400 text-sm">Create and schedule tweets</p>
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
                { id: 'post', label: 'Create Tweet', icon: Edit3 },
                { id: 'schedule', label: 'Scheduled', icon: Calendar, count: scheduledTweets.length }
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
                      layoutId="twitterActiveTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Create Tweet Tab */}
            {activeTab === 'post' && (
              <div className="space-y-5">
                {/* Context Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tweet Topic
                  </label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g., AI trends 2026, Tech startup journey, Web3 insights..."
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateTweet}
                  disabled={isGenerating || !context.trim()}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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

                {/* Generated Tweet */}
                {generatedTweet && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-gray-300">
                        Generated Tweet
                      </label>
                      <span className={`text-sm font-medium ${
                        characterCount > 280 ? 'text-red-500' : 
                        characterCount > 260 ? 'text-yellow-500' : 
                        'text-gray-400'
                      }`}>
                        {characterCount}/280
                      </span>
                    </div>
                    <textarea
                      value={generatedTweet}
                      onChange={handleTweetChange}
                      rows={5}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 resize-none"
                    />

                    {characterCount > 260 && characterCount <= 280 && (
                      <p className="text-sm text-yellow-500">Close to character limit</p>
                    )}
                    {characterCount > 280 && (
                      <p className="text-sm text-red-500">Exceeds 280 character limit</p>
                    )}

                    <button
                      onClick={handlePostToTwitter}
                      disabled={isPosting || characterCount > 280}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isPosting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Post to Twitter/X
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
                    <h3 className="text-lg font-medium text-white">Scheduled Tweets</h3>
                    <p className="text-gray-400 text-sm">AI generates unique tweets each time</p>
                  </div>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Schedule
                  </button>
                </div>

                {/* Scheduled Tweets List */}
                {scheduledTweets.length === 0 ? (
                  <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
                    <Calendar className="w-14 h-14 mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400">No scheduled tweets</p>
                    <p className="text-gray-500 text-sm mt-1">Add a schedule to auto-tweet daily</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scheduledTweets.map((schedule) => (
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
                              title="Tweet Now"
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
                      <p>Each scheduled tweet uses AI to generate unique content (max 280 chars). Tweets are different every time to keep your feed engaging.</p>
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
                    placeholder="e.g., Daily tech insights"
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
                  <span className="text-sm">AI Enhancement (unique tweets each time)</span>
                </label>

                <button
                  onClick={handleAddSchedule}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
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

export default TwitterDashboard;
