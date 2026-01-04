import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, X, Send, Users, RefreshCw, Plus, Trash2, 
  Phone, User, Clock, BarChart3, CheckCircle, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';

const WHATSAPP_API_BASE = import.meta.env.VITE_WHATSAPP_API_BASE || 'http://localhost:3002/api/whatsapp';
const BACKEND_API_BASE = import.meta.env.VITE_BACKEND_API_BASE || 'http://localhost:5000';

const WhatsAppDashboard = ({ isOpen, onClose, username }) => {
  const [activeTab, setActiveTab] = useState('groups');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // WhatsApp connected data
  const [availableGroups, setAvailableGroups] = useState([]);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  
  // User's saved data
  const [whatsappData, setWhatsappData] = useState(null);
  const [savedGroups, setSavedGroups] = useState([]);
  const [savedContacts, setSavedContacts] = useState([]);
  
  // Forms
  const [showSendMessageForm, setShowSendMessageForm] = useState(false);
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  
  const [addContactForm, setAddContactForm] = useState({ 
    contactName: '', 
    phoneNumber: '', 
    label: '' 
  });
  
  const [sendMessageForm, setSendMessageForm] = useState({
    sendMode: 'number', // 'number' or 'contact'
    recipient: '',
    phoneNumber: '',
    message: '',
    aiEnhance: false,
    scheduleTime: '',
    scheduleEnabled: false
  });
  
  // Selected items for viewing summary
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupSummary, setGroupSummary] = useState(null);

  // Load data on mount
  useEffect(() => {
    if (isOpen && username) {
      loadWhatsAppData();
      loadAvailableGroups();
    }
  }, [isOpen, username]);

  const loadAvailableGroups = async () => {
    try {
      const response = await axios.get(`${WHATSAPP_API_BASE}/groups?limit=100`);
      if (response.data.success) {
        setAvailableGroups(response.data.data || []);
        setWhatsappConnected(true);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      setWhatsappConnected(false);
    }
  };

  const loadWhatsAppData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_API_BASE}/whatsapp/data/${username}`);
      
      if (response.data.success) {
        setWhatsappData(response.data.data);
        setSavedGroups(response.data.data.savedGroups || []);
        setSavedContacts(response.data.data.savedContacts || []);
      }
    } catch (error) {
      console.error('Error loading WhatsApp data:', error);
      toast.error('Failed to load WhatsApp data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = async (group) => {
    setLoading(true);
    try {
      const saveResponse = await axios.post(`${BACKEND_API_BASE}/whatsapp/groups/save`, {
        username,
        groupId: group.id,
        groupName: group.name
      });
      
      if (saveResponse.data.success) {
        toast.success(`Group "${group.name}" added successfully!`);
        loadWhatsAppData();
      }
    } catch (error) {
      console.error('Error adding group:', error);
      toast.error(error.response?.data?.message || 'Failed to add group');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const saveResponse = await axios.post(`${BACKEND_API_BASE}/whatsapp/contacts/save`, {
        username,
        contactName: addContactForm.contactName,
        phoneNumber: addContactForm.phoneNumber,
        label: addContactForm.label
      });
      
      if (saveResponse.data.success) {
        toast.success(`Contact "${addContactForm.contactName}" added successfully!`);
        setAddContactForm({ contactName: '', phoneNumber: '', label: '' });
        setShowAddContactForm(false);
        loadWhatsAppData();
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error(error.response?.data?.message || 'Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGroup = async (groupId) => {
    if (!confirm('Are you sure you want to remove this group?')) return;
    
    try {
      const response = await axios.delete(`${BACKEND_API_BASE}/whatsapp/groups/remove`, {
        data: { username, groupId }
      });
      
      if (response.data.success) {
        toast.success('Group removed successfully');
        loadWhatsAppData();
      }
    } catch (error) {
      console.error('Error removing group:', error);
      toast.error('Failed to remove group');
    }
  };

  const handleRemoveContact = async (phoneNumber) => {
    if (!confirm('Are you sure you want to remove this contact?')) return;
    
    try {
      const response = await axios.delete(`${BACKEND_API_BASE}/whatsapp/contacts/remove`, {
        data: { username, phoneNumber }
      });
      
      if (response.data.success) {
        toast.success('Contact removed successfully');
        loadWhatsAppData();
      }
    } catch (error) {
      console.error('Error removing contact:', error);
      toast.error('Failed to remove contact');
    }
  };

  const handleRefreshGroupSummary = async (group) => {
    setRefreshing(true);
    setSelectedGroup(group);
    
    try {
      toast.info('Fetching messages from group...');
      
      // Fetch messages (limit to 20)
      const messagesResponse = await axios.post(`${WHATSAPP_API_BASE}/groups/messages/fetch`, {
        groupName: group.groupName,
        limit: 20
      });
      
      if (messagesResponse.data.success) {
        const messagesData = messagesResponse.data.data || {};
        const messages = messagesData.messages || [];
        
        if (messages.length === 0) {
          toast.warning('No messages found in this group!');
          setRefreshing(false);
          return;
        }
        
        // Generate AI summary
        toast.info('Generating AI summary...');
        
        const messageTexts = messages
          .filter(msg => msg.content && !msg.isFromMe)
          .map(msg => `${msg.senderName || msg.senderPhone}: ${msg.content}`)
          .join('\n');
        
        const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
        if (!groqApiKey) {
          toast.error('Groq API key not configured');
          setRefreshing(false);
          return;
        }
        
        const { Groq } = await import('groq-sdk');
        const groq = new Groq({ 
          apiKey: groqApiKey,
          dangerouslyAllowBrowser: true 
        });
        
        const summaryResponse = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes WhatsApp group conversations. Provide a concise summary highlighting key topics, important decisions, and notable interactions.'
            },
            {
              role: 'user',
              content: `Summarize the following WhatsApp group conversation from "${group.groupName}" (${messages.length} messages):\n\n${messageTexts}`
            }
          ],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.7,
          max_tokens: 1000
        });
        
        const aiSummary = summaryResponse.choices[0]?.message?.content || 'No summary generated';
        
        // Save summary to database
        await axios.post(`${BACKEND_API_BASE}/whatsapp/groups/save`, {
          username,
          groupId: group.groupId,
          groupName: group.groupName,
          summary: aiSummary,
          messageCount: messages.length
        });
        
        setGroupSummary({
          groupName: group.groupName,
          summary: aiSummary,
          messageCount: messages.length,
          lastUpdated: new Date().toISOString()
        });
        
        toast.success('Summary generated successfully!');
        loadWhatsAppData();
      }
    } catch (error) {
      console.error('Error refreshing group summary:', error);
      toast.error(error.response?.data?.message || 'Failed to refresh summary');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let messageContent = sendMessageForm.message;
      
      // AI Enhancement if enabled
      if (sendMessageForm.aiEnhance) {
        toast.info('Enhancing message with AI...');
        try {
          const enhanceResponse = await axios.post(`${WHATSAPP_API_BASE}/../ai/whatsapp/enhance`, {
            content: messageContent,
            platform: 'whatsapp',
            tone: 'friendly'
          });
          if (enhanceResponse.data.success) {
            messageContent = enhanceResponse.data.data.enhancedContent;
            toast.success('Message enhanced!');
          }
        } catch (aiError) {
          console.error('AI enhancement failed:', aiError);
          toast.warning('AI enhancement failed, sending original message');
        }
      }
      
      let phoneNumber = '';
      
      // Determine phone number based on send mode
      if (sendMessageForm.sendMode === 'contact') {
        const contact = savedContacts.find(c => c.contactName === sendMessageForm.recipient);
        if (!contact) {
          toast.error('Contact not found');
          setLoading(false);
          return;
        }
        phoneNumber = contact.phoneNumber;
      } else {
        phoneNumber = sendMessageForm.phoneNumber;
      }
      
      // Check if scheduling is enabled
      if (sendMessageForm.scheduleEnabled && sendMessageForm.scheduleTime) {
        const scheduleDate = new Date(sendMessageForm.scheduleTime);
        if (scheduleDate <= new Date()) {
          toast.error('Schedule time must be in the future');
          setLoading(false);
          return;
        }
        
        // Schedule the message
        const scheduleResponse = await axios.post(`${WHATSAPP_API_BASE}/messages/schedule`, {
          sendMode: 'number',
          phoneNumber: phoneNumber,
          content: messageContent,
          scheduleTime: scheduleDate.toISOString(),
          aiEnhance: false // Already enhanced if needed
        });
        
        if (scheduleResponse.data.success) {
          toast.success(`Message scheduled for ${scheduleDate.toLocaleString()}`);
          setSendMessageForm({
            sendMode: 'number',
            recipient: '',
            phoneNumber: '',
            message: '',
            aiEnhance: false,
            scheduleTime: '',
            scheduleEnabled: false
          });
          setShowSendMessageForm(false);
        }
      } else {
        // Send immediately
        const response = await axios.post(`${WHATSAPP_API_BASE}/messages/send-to-number`, {
          phoneNumber: phoneNumber,
          content: messageContent
        });
        
        if (response.data.success) {
          toast.success('Message sent successfully!');
          setSendMessageForm({
            sendMode: 'number',
            recipient: '',
            phoneNumber: '',
            message: '',
            aiEnhance: false,
            scheduleTime: '',
            scheduleEnabled: false
          });
          setShowSendMessageForm(false);
          
          // Update statistics
          await axios.post(`${BACKEND_API_BASE}/whatsapp/statistics/update`, {
            username,
            messagesSent: 1
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">WhatsApp Dashboard</h2>
                <p className="text-green-100 text-sm">Manage your groups and contacts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-green-800 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-gray-700 px-6 flex gap-4 border-b border-gray-600">
            <button
              onClick={() => setActiveTab('groups')}
              className={`py-3 px-4 font-medium transition-colors relative ${
                activeTab === 'groups'
                  ? 'text-green-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Groups ({savedGroups.length})
              </div>
              {activeTab === 'groups' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400"
                />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('contacts')}
              className={`py-3 px-4 font-medium transition-colors relative ${
                activeTab === 'contacts'
                  ? 'text-green-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Contacts ({savedContacts.length})
              </div>
              {activeTab === 'contacts' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400"
                />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('statistics')}
              className={`py-3 px-4 font-medium transition-colors relative ${
                activeTab === 'statistics'
                  ? 'text-green-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Statistics
              </div>
              {activeTab === 'statistics' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400"
                />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {loading && !refreshing ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              </div>
            ) : (
              <>
                {/* Groups Tab */}
                {activeTab === 'groups' && (
                  <div className="space-y-6">
                    {/* Connection Status */}
                    {!whatsappConnected && (
                      <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-yellow-400 font-semibold">WhatsApp Not Connected</h4>
                            <p className="text-yellow-200 text-sm mt-1">Make sure WhatsApp service is running on port 3002</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Available Groups Section */}
                    {whatsappConnected && availableGroups.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Available WhatsApp Groups</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                          {availableGroups.map((group) => {
                            const isAdded = savedGroups.some(g => g.groupId === group.id);
                            return (
                              <div key={group.id} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="text-white font-medium text-sm">{group.name}</h4>
                                  <p className="text-gray-400 text-xs mt-1">
                                    {group.participantCount || 0} participants
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleAddGroup(group)}
                                  disabled={isAdded || loading}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    isAdded
                                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                      : 'bg-green-600 hover:bg-green-700 text-white'
                                  }`}
                                >
                                  {isAdded ? 'Added' : 'Add'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Saved Groups Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">My Saved Groups ({savedGroups.length})</h3>
                      {savedGroups.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 bg-gray-700 rounded-lg">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No groups saved yet</p>
                          <p className="text-xs mt-1">Add groups from available list above</p>
                        </div>
                      ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {savedGroups.map((group) => (
                          <motion.div
                            key={group.groupId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-700 p-4 rounded-lg hover:bg-gray-650 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="text-white font-semibold text-lg mb-1">
                                  {group.groupName}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <MessageCircle className="w-3 h-3" />
                                    {group.messageCount || 0} messages
                                  </span>
                                  {group.lastFetchDate && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(group.lastFetchDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveGroup(group.groupId)}
                                className="text-red-400 hover:text-red-300 p-1 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {group.lastSummary && (
                              <div className="bg-gray-800 p-3 rounded-lg mb-3 text-sm text-gray-300">
                                <p className="line-clamp-3">{group.lastSummary}</p>
                              </div>
                            )}

                            <button
                              onClick={() => handleRefreshGroupSummary(group)}
                              disabled={refreshing && selectedGroup?.groupId === group.groupId}
                              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                              <RefreshCw className={`w-4 h-4 ${refreshing && selectedGroup?.groupId === group.groupId ? 'animate-spin' : ''}`} />
                              {refreshing && selectedGroup?.groupId === group.groupId ? 'Refreshing...' : 'Refresh Summary'}
                            </button>
                          </motion.div>
                        ))}
                      </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contacts Tab */}
                {activeTab === 'contacts' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white">Send Message</h3>
                      <button
                        onClick={() => setShowAddContactForm(!showAddContactForm)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Contact
                      </button>
                    </div>

                    {/* Send Message Form */}
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <form onSubmit={handleSendMessage} className="space-y-4">
                        {/* Send Mode Toggle */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSendMessageForm({ ...sendMessageForm, sendMode: 'number' })}
                            className={`flex-1 py-2 px-4 rounded-lg transition-colors font-medium ${
                              sendMessageForm.sendMode === 'number'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                          >
                            Phone Number
                          </button>
                          <button
                            type="button"
                            onClick={() => setSendMessageForm({ ...sendMessageForm, sendMode: 'contact' })}
                            className={`flex-1 py-2 px-4 rounded-lg transition-colors font-medium ${
                              sendMessageForm.sendMode === 'contact'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                          >
                            Saved Contact
                          </button>
                        </div>

                        {/* Recipient Input */}
                        {sendMessageForm.sendMode === 'number' ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Phone Number (with country code)
                            </label>
                            <input
                              type="tel"
                              value={sendMessageForm.phoneNumber}
                              onChange={(e) => setSendMessageForm({ ...sendMessageForm, phoneNumber: e.target.value })}
                              className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="+919876543210"
                              required
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Select Contact
                            </label>
                            <select
                              value={sendMessageForm.recipient}
                              onChange={(e) => setSendMessageForm({ ...sendMessageForm, recipient: e.target.value })}
                              className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                              required
                            >
                              <option value="">Select a contact</option>
                              {savedContacts.map((contact) => (
                                <option key={contact.phoneNumber} value={contact.contactName}>
                                  {contact.contactName} {contact.label && `(${contact.label})`} - {contact.phoneNumber}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Message Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Message
                          </label>
                          <textarea
                            value={sendMessageForm.message}
                            onChange={(e) => setSendMessageForm({ ...sendMessageForm, message: e.target.value })}
                            className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[100px]"
                            placeholder="Type your message here..."
                            required
                          />
                        </div>

                        {/* AI Enhancement Toggle */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="ai-enhance"
                            checked={sendMessageForm.aiEnhance}
                            onChange={(e) => setSendMessageForm({ ...sendMessageForm, aiEnhance: e.target.checked })}
                            className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                          />
                          <label htmlFor="ai-enhance" className="text-sm text-gray-300 flex items-center gap-1">
                            <span className="text-purple-400">✨</span> AI Enhancement (Groq)
                          </label>
                        </div>

                        {/* Schedule Toggle */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="schedule-enable"
                            checked={sendMessageForm.scheduleEnabled}
                            onChange={(e) => setSendMessageForm({ ...sendMessageForm, scheduleEnabled: e.target.checked })}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="schedule-enable" className="text-sm text-gray-300 flex items-center gap-1">
                            <Clock className="w-4 h-4 text-blue-400" /> Schedule Message
                          </label>
                        </div>

                        {/* Schedule Time Input */}
                        {sendMessageForm.scheduleEnabled && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Schedule Time
                            </label>
                            <input
                              type="datetime-local"
                              value={sendMessageForm.scheduleTime}
                              onChange={(e) => setSendMessageForm({ ...sendMessageForm, scheduleTime: e.target.value })}
                              min={new Date().toISOString().slice(0, 16)}
                              className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                        )}

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                        >
                          <Send className="w-4 h-4" />
                          {loading ? 'Sending...' : (sendMessageForm.scheduleEnabled ? 'Schedule Message' : 'Send Now')}
                        </button>
                      </form>
                    </div>

                    {/* Add Contact Form */}
                    {showAddContactForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-700 p-4 rounded-lg mb-4"
                      >
                        <form onSubmit={handleAddContact} className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Contact Name
                            </label>
                            <input
                              type="text"
                              value={addContactForm.contactName}
                              onChange={(e) => setAddContactForm({ ...addContactForm, contactName: e.target.value })}
                              className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="e.g., Anshul"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={addContactForm.phoneNumber}
                              onChange={(e) => setAddContactForm({ ...addContactForm, phoneNumber: e.target.value })}
                              className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="+919876543210"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Label (Optional)
                            </label>
                            <input
                              type="text"
                              value={addContactForm.label}
                              onChange={(e) => setAddContactForm({ ...addContactForm, label: e.target.value })}
                              className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="e.g., Friend, Colleague"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Add Contact
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddContactForm(false)}
                              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}

                    {/* Contacts List */}
                    {savedContacts.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No contacts saved yet</p>
                        <p className="text-sm mt-2">Add contacts to quickly send messages</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {savedContacts.map((contact) => (
                          <motion.div
                            key={contact.phoneNumber}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-700 p-4 rounded-lg hover:bg-gray-650 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="text-white font-semibold">{contact.contactName}</h4>
                                {contact.label && (
                                  <span className="text-xs text-green-400 bg-green-900 px-2 py-1 rounded mt-1 inline-block">
                                    {contact.label}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveContact(contact.phoneNumber)}
                                className="text-red-400 hover:text-red-300 p-1 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                              <Phone className="w-3 h-3" />
                              <span>{contact.phoneNumber}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Statistics Tab */}
                {activeTab === 'statistics' && whatsappData && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white mb-4">WhatsApp Statistics</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Users className="w-8 h-8 text-white opacity-80" />
                          <CheckCircle className="w-5 h-5 text-white opacity-60" />
                        </div>
                        <p className="text-3xl font-bold text-white">
                          {whatsappData.statistics?.totalGroupsSummarized || 0}
                        </p>
                        <p className="text-green-100 text-sm mt-1">Groups Summarized</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Send className="w-8 h-8 text-white opacity-80" />
                          <CheckCircle className="w-5 h-5 text-white opacity-60" />
                        </div>
                        <p className="text-3xl font-bold text-white">
                          {whatsappData.statistics?.totalMessagesSent || 0}
                        </p>
                        <p className="text-blue-100 text-sm mt-1">Messages Sent</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <MessageCircle className="w-8 h-8 text-white opacity-80" />
                          <CheckCircle className="w-5 h-5 text-white opacity-60" />
                        </div>
                        <p className="text-3xl font-bold text-white">
                          {whatsappData.statistics?.totalMessagesReceived || 0}
                        </p>
                        <p className="text-purple-100 text-sm mt-1">Messages Received</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <User className="w-8 h-8 text-white opacity-80" />
                          <CheckCircle className="w-5 h-5 text-white opacity-60" />
                        </div>
                        <p className="text-3xl font-bold text-white">
                          {savedContacts.length}
                        </p>
                        <p className="text-orange-100 text-sm mt-1">Saved Contacts</p>
                      </div>
                    </div>

                    {whatsappData.whatsappAccount?.isConnected && (
                      <div className="bg-gray-700 p-6 rounded-lg">
                        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          WhatsApp Account Connected
                        </h4>
                        <div className="space-y-2 text-gray-300">
                          <p><span className="text-gray-400">Phone:</span> {whatsappData.whatsappAccount.phoneNumber || 'N/A'}</p>
                          <p><span className="text-gray-400">Last Connected:</span> {whatsappData.whatsappAccount.lastConnected ? new Date(whatsappData.whatsappAccount.lastConnected).toLocaleString() : 'N/A'}</p>
                        </div>
                      </div>
                    )}

                    {!whatsappData.whatsappAccount?.isConnected && (
                      <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 p-6 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                          <div>
                            <h4 className="text-yellow-400 font-semibold mb-2">WhatsApp Not Connected</h4>
                            <p className="text-yellow-200 text-sm">
                              Connect your WhatsApp account to start using all features. Make sure the WhatsApp service is running.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Group Summary Modal */}
          {groupSummary && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
              onClick={() => setGroupSummary(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{groupSummary.groupName}</h3>
                  <button
                    onClick={() => setGroupSummary(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {groupSummary.messageCount} messages
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(groupSummary.lastUpdated).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-green-400 font-semibold mb-2">AI Summary</h4>
                    <p className="text-gray-300 whitespace-pre-wrap">{groupSummary.summary}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WhatsAppDashboard;
