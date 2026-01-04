import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, X, Send, Users, RefreshCw, Plus, Trash2, 
  Phone, User, Clock, BarChart3, CheckCircle, AlertCircle,
  Search, Filter, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';

const WHATSAPP_API_BASE = import.meta.env.VITE_WHATSAPP_API_BASE || 'http://localhost:3002/api/whatsapp';
const BACKEND_API_BASE = import.meta.env.VITE_BACKEND_API_BASE || 'http://localhost:5000';

const WhatsAppDashboardRefined = ({ isOpen, onClose, username }) => {
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
  
  // Modals
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedGroupSummary, setSelectedGroupSummary] = useState(null);
  
  // Search and filter
  const [groupSearch, setGroupSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  
  // Send message form
  const [sendMessageForm, setSendMessageForm] = useState({
    sendMode: 'number',
    recipient: '',
    phoneNumber: '',
    message: '',
    aiEnhance: false,
    scheduleTime: '',
    scheduleEnabled: false
  });
  
  const [addContactForm, setAddContactForm] = useState({ 
    contactName: '', 
    phoneNumber: '', 
    label: '' 
  });

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
        toast.success(`Group "${group.name}" added!`);
        loadWhatsAppData();
      }
    } catch (error) {
      console.error('Error adding group:', error);
      toast.error(error.response?.data?.message || 'Failed to add group');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGroup = async (groupId) => {
    if (!confirm('Remove this group?')) return;
    try {
      const response = await axios.delete(`${BACKEND_API_BASE}/whatsapp/groups/remove`, {
        data: { username, groupId }
      });
      if (response.data.success) {
        toast.success('Group removed');
        loadWhatsAppData();
      }
    } catch (error) {
      toast.error('Failed to remove group');
    }
  };

  const handleRefreshGroupSummary = async (group) => {
    setRefreshing(true);
    try {
      toast.info('Fetching messages...');
      const messagesResponse = await axios.post(`${WHATSAPP_API_BASE}/groups/messages/fetch`, {
        groupName: group.groupName,
        limit: 20
      });
      
      if (messagesResponse.data.success) {
        const messages = messagesResponse.data.data?.messages || [];
        if (messages.length === 0) {
          toast.warning('No messages found');
          setRefreshing(false);
          return;
        }
        
        toast.info('Generating AI summary...');
        const messageTexts = messages
          .filter(msg => msg.content && !msg.isFromMe)
          .map(msg => `${msg.senderName || msg.senderPhone}: ${msg.content}`)
          .join('\n');
        
        const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
        const { Groq } = await import('groq-sdk');
        const groq = new Groq({ apiKey: groqApiKey, dangerouslyAllowBrowser: true });
        
        const summaryResponse = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: 'Summarize WhatsApp group conversations concisely, highlighting key topics and decisions.' },
            { role: 'user', content: `Summarize: ${messageTexts}` }
          ],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.7,
          max_tokens: 1000
        });
        
        const aiSummary = summaryResponse.choices[0]?.message?.content || 'No summary generated';
        
        await axios.post(`${BACKEND_API_BASE}/whatsapp/groups/save`, {
          username,
          groupId: group.groupId,
          groupName: group.groupName,
          summary: aiSummary,
          messageCount: messages.length
        });
        
        setSelectedGroupSummary({
          groupName: group.groupName,
          summary: aiSummary,
          messageCount: messages.length,
          lastUpdated: new Date().toISOString()
        });
        setShowSummaryModal(true);
        toast.success('Summary generated!');
        loadWhatsAppData();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate summary');
    } finally {
      setRefreshing(false);
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
        toast.success(`Contact "${addContactForm.contactName}" added!`);
        setAddContactForm({ contactName: '', phoneNumber: '', label: '' });
        setShowAddContactModal(false);
        loadWhatsAppData();
      }
    } catch (error) {
      toast.error('Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveContact = async (phoneNumber) => {
    if (!confirm('Remove this contact?')) return;
    try {
      const response = await axios.delete(`${BACKEND_API_BASE}/whatsapp/contacts/remove`, {
        data: { username, phoneNumber }
      });
      if (response.data.success) {
        toast.success('Contact removed');
        loadWhatsAppData();
      }
    } catch (error) {
      toast.error('Failed to remove contact');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let messageContent = sendMessageForm.message;
      
      if (sendMessageForm.aiEnhance) {
        toast.info('Enhancing with AI...');
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
          toast.warning('AI enhancement failed, using original');
        }
      }
      
      let phoneNumber = '';
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
      
      if (sendMessageForm.scheduleEnabled && sendMessageForm.scheduleTime) {
        const scheduleDate = new Date(sendMessageForm.scheduleTime);
        if (scheduleDate <= new Date()) {
          toast.error('Schedule time must be in future');
          setLoading(false);
          return;
        }
        
        const scheduleResponse = await axios.post(`${WHATSAPP_API_BASE}/messages/schedule`, {
          sendMode: 'number',
          phoneNumber: phoneNumber,
          content: messageContent,
          scheduleTime: scheduleDate.toISOString(),
          aiEnhance: false
        });
        
        if (scheduleResponse.data.success) {
          toast.success(`Scheduled for ${scheduleDate.toLocaleString()}`);
          setSendMessageForm({
            sendMode: 'number',
            recipient: '',
            phoneNumber: '',
            message: '',
            aiEnhance: false,
            scheduleTime: '',
            scheduleEnabled: false
          });
        }
      } else {
        const response = await axios.post(`${WHATSAPP_API_BASE}/messages/send-to-number`, {
          phoneNumber: phoneNumber,
          content: messageContent
        });
        
        if (response.data.success) {
          toast.success('Message sent!');
          setSendMessageForm({
            sendMode: 'number',
            recipient: '',
            phoneNumber: '',
            message: '',
            aiEnhance: false,
            scheduleTime: '',
            scheduleEnabled: false
          });
          
          await axios.post(`${BACKEND_API_BASE}/whatsapp/statistics/update`, {
            username,
            messagesSent: 1
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = savedGroups.filter(g => 
    g.groupName.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const filteredContacts = savedContacts.filter(c => 
    c.contactName.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.phoneNumber.includes(contactSearch)
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg backdrop-blur-sm">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">WhatsApp Manager</h2>
                <p className="text-blue-100 text-sm">Manage groups, contacts & messages</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
            <div className="flex px-6">
              {[
                { id: 'groups', label: 'Groups', icon: Users, count: savedGroups.length },
                { id: 'contacts', label: 'Contacts', icon: User, count: savedContacts.length },
                { id: 'statistics', label: 'Stats', icon: BarChart3 }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-4 px-6 font-medium transition-all ${
                    activeTab === tab.id
                      ? 'text-blue-400'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activeTab === tab.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </div>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && !refreshing ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Groups Tab */}
                {activeTab === 'groups' && (
                  <div className="space-y-6">
                    {/* Connection Status */}
                    {!whatsappConnected && (
                      <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-yellow-400 font-semibold">WhatsApp Not Connected</h4>
                            <p className="text-yellow-200 text-sm mt-1">Ensure WhatsApp service is running on port 3002</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Summary Section */}
                    {savedGroups.length > 0 && (
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold">Group Summaries</h3>
                            <p className="text-blue-100 text-sm mt-1">AI-powered insights from your groups</p>
                          </div>
                          <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg backdrop-blur-sm">
                            <span className="text-2xl font-bold">{savedGroups.length}</span>
                            <span className="text-sm ml-2">Groups</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                            <div className="text-3xl font-bold">{savedGroups.filter(g => g.lastSummary).length}</div>
                            <div className="text-sm text-blue-100 mt-1">With Summaries</div>
                          </div>
                          <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                            <div className="text-3xl font-bold">
                              {savedGroups.reduce((sum, g) => sum + (g.messageCount || 0), 0)}
                            </div>
                            <div className="text-sm text-blue-100 mt-1">Total Messages</div>
                          </div>
                          <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                            <div className="text-3xl font-bold">{whatsappData?.statistics?.totalGroupsSummarized || 0}</div>
                            <div className="text-sm text-blue-100 mt-1">Summaries Generated</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={groupSearch}
                          onChange={(e) => setGroupSearch(e.target.value)}
                          placeholder="Search groups..."
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={() => setShowAddGroupModal(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-lg hover:shadow-xl"
                      >
                        <Plus className="w-4 h-4" />
                        Add Group
                      </button>
                    </div>

                    {/* Saved Groups Grid */}
                    {filteredGroups.length === 0 ? (
                      <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
                        <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-400 text-lg">No groups saved yet</p>
                        <p className="text-gray-500 text-sm mt-2">Click "Add Group" to get started</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredGroups.map((group) => (
                          <motion.div
                            key={group.groupId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-blue-500 transition-all group"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="text-white font-semibold text-lg mb-1">{group.groupName}</h4>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    {group.messageCount || 0} msgs
                                  </span>
                                  {group.lastFetchDate && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      {new Date(group.lastFetchDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveGroup(group.groupId)}
                                className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-700 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {group.lastSummary && (
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-3">
                                <p className="text-gray-300 text-sm line-clamp-2">{group.lastSummary}</p>
                              </div>
                            )}

                            <button
                              onClick={() => handleRefreshGroupSummary(group)}
                              disabled={refreshing}
                              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                              {refreshing ? 'Generating...' : 'Refresh Summary'}
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Contacts Tab */}
                {activeTab === 'contacts' && (
                  <div className="space-y-6">
                    {/* Send Message Section */}
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                      <h3 className="text-xl font-bold mb-4">Send Message</h3>
                      <form onSubmit={handleSendMessage} className="space-y-4">
                        {/* Mode Toggle */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSendMessageForm({ ...sendMessageForm, sendMode: 'number' })}
                            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                              sendMessageForm.sendMode === 'number'
                                ? 'bg-white text-green-600 shadow-lg'
                                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                            }`}
                          >
                            Phone Number
                          </button>
                          <button
                            type="button"
                            onClick={() => setSendMessageForm({ ...sendMessageForm, sendMode: 'contact' })}
                            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                              sendMessageForm.sendMode === 'contact'
                                ? 'bg-white text-green-600 shadow-lg'
                                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                            }`}
                          >
                            Saved Contact
                          </button>
                        </div>

                        {/* Recipient Input */}
                        {sendMessageForm.sendMode === 'number' ? (
                          <input
                            type="tel"
                            value={sendMessageForm.phoneNumber}
                            onChange={(e) => setSendMessageForm({ ...sendMessageForm, phoneNumber: e.target.value })}
                            className="w-full bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg px-4 py-3 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                            placeholder="+919876543210"
                            required
                          />
                        ) : (
                          <select
                            value={sendMessageForm.recipient}
                            onChange={(e) => setSendMessageForm({ ...sendMessageForm, recipient: e.target.value })}
                            className="w-full bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                            required
                          >
                            <option value="" className="text-gray-900">Select contact</option>
                            {savedContacts.map((contact) => (
                              <option key={contact.phoneNumber} value={contact.contactName} className="text-gray-900">
                                {contact.contactName} {contact.label && `(${contact.label})`}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Message Input */}
                        <textarea
                          value={sendMessageForm.message}
                          onChange={(e) => setSendMessageForm({ ...sendMessageForm, message: e.target.value })}
                          className="w-full bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg px-4 py-3 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 min-h-[100px] resize-none"
                          placeholder="Type your message..."
                          required
                        />

                        {/* Options */}
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sendMessageForm.aiEnhance}
                              onChange={(e) => setSendMessageForm({ ...sendMessageForm, aiEnhance: e.target.checked })}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-sm">✨ AI Enhancement</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sendMessageForm.scheduleEnabled}
                              onChange={(e) => setSendMessageForm({ ...sendMessageForm, scheduleEnabled: e.target.checked })}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-sm">📅 Schedule</span>
                          </label>
                        </div>

                        {sendMessageForm.scheduleEnabled && (
                          <input
                            type="datetime-local"
                            value={sendMessageForm.scheduleTime}
                            onChange={(e) => setSendMessageForm({ ...sendMessageForm, scheduleTime: e.target.value })}
                            min={new Date().toISOString().slice(0, 16)}
                            className="w-full bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                            required
                          />
                        )}

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Send className="w-4 h-4" />
                          {loading ? 'Sending...' : (sendMessageForm.scheduleEnabled ? 'Schedule' : 'Send Now')}
                        </button>
                      </form>
                    </div>

                    {/* Contacts List */}
                    <div>
                      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
                        <div className="relative flex-1 max-w-md">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={contactSearch}
                            onChange={(e) => setContactSearch(e.target.value)}
                            placeholder="Search contacts..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          onClick={() => setShowAddContactModal(true)}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-lg hover:shadow-xl"
                        >
                          <Plus className="w-4 h-4" />
                          Add Contact
                        </button>
                      </div>

                      {filteredContacts.length === 0 ? (
                        <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
                          <User className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                          <p className="text-gray-400 text-lg">No contacts saved yet</p>
                          <p className="text-gray-500 text-sm mt-2">Click "Add Contact" to get started</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredContacts.map((contact) => (
                            <motion.div
                              key={contact.phoneNumber}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-green-500 transition-all"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="text-white font-semibold">{contact.contactName}</h4>
                                  {contact.label && (
                                    <span className="inline-block mt-1 text-xs bg-green-500 bg-opacity-20 text-green-400 px-2 py-1 rounded">
                                      {contact.label}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleRemoveContact(contact.phoneNumber)}
                                  className="text-gray-500 hover:text-red-400 p-1 rounded-lg hover:bg-gray-700 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{contact.phoneNumber}</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Statistics Tab */}
                {activeTab === 'statistics' && whatsappData && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-white">Statistics</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Groups Summarized', value: whatsappData.statistics?.totalGroupsSummarized || 0, color: 'from-blue-500 to-blue-600', icon: Users },
                        { label: 'Messages Sent', value: whatsappData.statistics?.totalMessagesSent || 0, color: 'from-green-500 to-green-600', icon: Send },
                        { label: 'Messages Received', value: whatsappData.statistics?.totalMessagesReceived || 0, color: 'from-purple-500 to-purple-600', icon: MessageCircle },
                        { label: 'Saved Contacts', value: savedContacts.length, color: 'from-pink-500 to-pink-600', icon: User }
                      ].map((stat, idx) => (
                        <div key={idx} className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 text-white`}>
                          <div className="flex items-center justify-between mb-3">
                            <stat.icon className="w-8 h-8 opacity-80" />
                            <CheckCircle className="w-5 h-5 opacity-60" />
                          </div>
                          <div className="text-3xl font-bold mb-1">{stat.value}</div>
                          <div className="text-sm opacity-90">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {whatsappData.whatsappAccount?.isConnected ? (
                      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          WhatsApp Connected
                        </h4>
                        <div className="space-y-2 text-gray-300 text-sm">
                          <p><span className="text-gray-400">Phone:</span> {whatsappData.whatsappAccount.phoneNumber || 'N/A'}</p>
                          <p><span className="text-gray-400">Last Connected:</span> {whatsappData.whatsappAccount.lastConnected ? new Date(whatsappData.whatsappAccount.lastConnected).toLocaleString() : 'N/A'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                          <div>
                            <h4 className="text-yellow-400 font-semibold mb-2">Not Connected</h4>
                            <p className="text-yellow-200 text-sm">Connect WhatsApp to use all features</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Add Group Modal */}
      <AnimatePresence>
        {showAddGroupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Add WhatsApp Group</h3>
                <button
                  onClick={() => setShowAddGroupModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                {availableGroups.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No groups available</p>
                    <p className="text-sm mt-2">Make sure WhatsApp is connected</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {availableGroups.map((group) => {
                      const isAdded = savedGroups.some(g => g.groupId === group.id);
                      return (
                        <div key={group.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between hover:border-blue-500 transition-all">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{group.name}</h4>
                            <p className="text-gray-400 text-sm mt-1">{group.participantCount || 0} participants</p>
                          </div>
                          <button
                            onClick={() => handleAddGroup(group)}
                            disabled={isAdded || loading}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              isAdded
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                            }`}
                          >
                            {isAdded ? 'Added' : 'Add'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddContactModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md"
            >
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Add Contact</h3>
                <button
                  onClick={() => setShowAddContactModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddContact} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contact Name</label>
                  <input
                    type="text"
                    value={addContactForm.contactName}
                    onChange={(e) => setAddContactForm({ ...addContactForm, contactName: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Anshul"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={addContactForm.phoneNumber}
                    onChange={(e) => setAddContactForm({ ...addContactForm, phoneNumber: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="+919876543210"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Label (Optional)</label>
                  <input
                    type="text"
                    value={addContactForm.label}
                    onChange={(e) => setAddContactForm({ ...addContactForm, label: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Friend, Colleague"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Contact'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Summary Modal */}
      <AnimatePresence>
        {showSummaryModal && selectedGroupSummary && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{selectedGroupSummary.groupName}</h3>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {selectedGroupSummary.messageCount} messages
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(selectedGroupSummary.lastUpdated).toLocaleString()}
                  </span>
                </div>
                
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    AI Summary
                  </h4>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{selectedGroupSummary.summary}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default WhatsAppDashboardRefined;
