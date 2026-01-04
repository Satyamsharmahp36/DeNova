import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  MessageCircle, X, Send, Users, RefreshCw, Plus, Trash2, 
  Phone, User, Search, ChevronRight, Wallet, Shield, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useSolana } from '../hooks/useSolana';

const WHATSAPP_API_BASE = import.meta.env.VITE_WHATSAPP_API_BASE || 'http://localhost:3002/api/whatsapp';
const BACKEND_API_BASE = import.meta.env.VITE_BACKEND_API_BASE || 'http://localhost:5000';

const WhatsAppDashboardSimple = ({ isOpen, onClose, username }) => {
  const { isConnected, walletAddress, connect, signAction, formatAddress } = useSolana();
  const [activeTab, setActiveTab] = useState('groups');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSigningAction, setIsSigningAction] = useState(false);
  
  const [availableGroups, setAvailableGroups] = useState([]);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  
  const [whatsappData, setWhatsappData] = useState(null);
  const [savedGroups, setSavedGroups] = useState([]);
  const [savedContacts, setSavedContacts] = useState([]);
  
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  const [groupSearch, setGroupSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  
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
        toast.success(`Group "${group.name}" added`);
        loadWhatsAppData();
      }
    } catch (error) {
      console.error('Error adding group:', error);
      toast.error('Failed to add group');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGroup = async (groupId, e) => {
    e.stopPropagation();
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

  const handleViewGroupSummary = async (group) => {
    setSelectedGroup(group);
    
    if (!group.lastSummary) {
      await handleRefreshGroupSummary(group);
    } else {
      setShowSummaryModal(true);
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
        
        toast.info('Generating summary...');
        const messageTexts = messages
          .filter(msg => msg.content && !msg.isFromMe)
          .map(msg => `${msg.senderName || msg.senderPhone}: ${msg.content}`)
          .join('\n');
        
        const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
        const { Groq } = await import('groq-sdk');
        const groq = new Groq({ apiKey: groqApiKey, dangerouslyAllowBrowser: true });
        
        const summaryResponse = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: 'Summarize WhatsApp conversations concisely, highlighting key topics and decisions.' },
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
        
        setSelectedGroup({ ...group, lastSummary: aiSummary, messageCount: messages.length });
        setShowSummaryModal(true);
        toast.success('Summary generated');
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
        toast.success(`Contact added`);
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
    
    // Wallet signature gate for security
    if (!isConnected) {
      toast.error('Please connect your wallet to authorize this action');
      return;
    }
    
    setIsSigningAction(true);
    let signatureData = null;
    try {
      // Request wallet signature before sending
      const recipient = sendMessageForm.sendMode === 'contact' 
        ? sendMessageForm.recipient 
        : sendMessageForm.phoneNumber;
      signatureData = await signAction('WHATSAPP_SEND_MESSAGE', `Sending message to ${recipient}`);
      toast.success('Action authorized!');
    } catch (signError) {
      console.error('Signature rejected:', signError);
      toast.error('Action cancelled - wallet signature required');
      setIsSigningAction(false);
      return;
    }
    setIsSigningAction(false);
    
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
            toast.success('Message enhanced');
          }
        } catch (aiError) {
          toast.warning('Using original message');
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
          toast.success('Message sent');
          
          // Log the action
          try {
            await axios.post(`${BACKEND_API_BASE}/ai-actions/log`, {
              username,
              actionType: 'WHATSAPP_SEND_MESSAGE',
              actionDetails: {
                recipient: phoneNumber,
                content: messageContent,
                platform: 'whatsapp'
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
                message: 'Message sent successfully',
                executedAt: new Date()
              }
            });
          } catch (logError) {
            console.error('Failed to log action:', logError);
          }
          
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
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gray-800 border-b border-gray-700 p-5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-gray-700 p-2.5 rounded-lg">
                <MessageCircle className="w-5 h-5 text-gray-300" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">WhatsApp Manager</h2>
                <p className="text-gray-400 text-sm">Manage groups and contacts</p>
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
                { id: 'groups', label: 'Groups', icon: Users, count: savedGroups.length },
                { id: 'contacts', label: 'Contacts', icon: User, count: savedContacts.length }
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
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab.id
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {tab.count}
                    </span>
                  </div>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
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
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-400"></div>
              </div>
            ) : (
              <>
                {/* Groups Tab */}
                {activeTab === 'groups' && (
                  <div className="space-y-5">
                    {/* Actions Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          value={groupSearch}
                          onChange={(e) => setGroupSearch(e.target.value)}
                          placeholder="Search groups..."
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                        />
                      </div>
                      <button
                        onClick={() => setShowAddGroupModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Group
                      </button>
                    </div>

                    {/* Groups Grid */}
                    {filteredGroups.length === 0 ? (
                      <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
                        <Users className="w-14 h-14 mx-auto mb-3 text-gray-600" />
                        <p className="text-gray-400">No groups saved</p>
                        <p className="text-gray-500 text-sm mt-1">Click "Add Group" to get started</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredGroups.map((group) => (
                          <motion.div
                            key={group.groupId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => handleViewGroupSummary(group)}
                            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 hover:bg-gray-750 transition-all cursor-pointer group"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-base truncate group-hover:text-gray-100">
                                  {group.groupName}
                                </h4>
                                {group.lastSummary && (
                                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                                    {group.lastSummary}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <button
                                  onClick={(e) => handleRemoveGroup(group.groupId, e)}
                                  className="text-gray-500 hover:text-red-400 p-1.5 rounded hover:bg-gray-700 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Contacts Tab */}
                {activeTab === 'contacts' && (
                  <div className="space-y-5">
                    {/* Send Message Section */}
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                      <h3 className="text-lg font-semibold text-white mb-4">Send Message</h3>
                      <form onSubmit={handleSendMessage} className="space-y-4">
                        {/* Mode Toggle */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSendMessageForm({ ...sendMessageForm, sendMode: 'number' })}
                            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
                              sendMessageForm.sendMode === 'number'
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                            }`}
                          >
                            Phone Number
                          </button>
                          <button
                            type="button"
                            onClick={() => setSendMessageForm({ ...sendMessageForm, sendMode: 'contact' })}
                            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
                              sendMessageForm.sendMode === 'contact'
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
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
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                            placeholder="+919876543210"
                            required
                          />
                        ) : (
                          <select
                            value={sendMessageForm.recipient}
                            onChange={(e) => setSendMessageForm({ ...sendMessageForm, recipient: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gray-600"
                            required
                          >
                            <option value="">Select contact</option>
                            {savedContacts.map((contact) => (
                              <option key={contact.phoneNumber} value={contact.contactName}>
                                {contact.contactName} {contact.label && `(${contact.label})`}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Message Input */}
                        <textarea
                          value={sendMessageForm.message}
                          onChange={(e) => setSendMessageForm({ ...sendMessageForm, message: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 min-h-[100px] resize-none"
                          placeholder="Type your message..."
                          required
                        />

                        {/* Options */}
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
                            <input
                              type="checkbox"
                              checked={sendMessageForm.aiEnhance}
                              onChange={(e) => setSendMessageForm({ ...sendMessageForm, aiEnhance: e.target.checked })}
                              className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                            />
                            <span className="text-sm">AI Enhancement</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
                            <input
                              type="checkbox"
                              checked={sendMessageForm.scheduleEnabled}
                              onChange={(e) => setSendMessageForm({ ...sendMessageForm, scheduleEnabled: e.target.checked })}
                              className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                            />
                            <span className="text-sm">Schedule</span>
                          </label>
                        </div>

                        {sendMessageForm.scheduleEnabled && (
                          <input
                            type="datetime-local"
                            value={sendMessageForm.scheduleTime}
                            onChange={(e) => setSendMessageForm({ ...sendMessageForm, scheduleTime: e.target.value })}
                            min={new Date().toISOString().slice(0, 16)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gray-600"
                            required
                          />
                        )}

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          {loading ? 'Sending...' : (sendMessageForm.scheduleEnabled ? 'Schedule' : 'Send')}
                        </button>
                      </form>
                    </div>

                    {/* Contacts List */}
                    <div>
                      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
                        <div className="relative flex-1 max-w-md">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            value={contactSearch}
                            onChange={(e) => setContactSearch(e.target.value)}
                            placeholder="Search contacts..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                          />
                        </div>
                        <button
                          onClick={() => setShowAddContactModal(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Contact
                        </button>
                      </div>

                      {filteredContacts.length === 0 ? (
                        <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
                          <User className="w-14 h-14 mx-auto mb-3 text-gray-600" />
                          <p className="text-gray-400">No contacts saved</p>
                          <p className="text-gray-500 text-sm mt-1">Click "Add Contact" to get started</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {filteredContacts.map((contact) => (
                            <motion.div
                              key={contact.phoneNumber}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-medium truncate">{contact.contactName}</h4>
                                  {contact.label && (
                                    <span className="inline-block mt-1 text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                                      {contact.label}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleRemoveContact(contact.phoneNumber)}
                                  className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-gray-700 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Phone className="w-3.5 h-3.5" />
                                <span className="truncate">{contact.phoneNumber}</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Group Modal */}
      {showAddGroupModal && ReactDOM.createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4" onClick={() => setShowAddGroupModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              <div className="bg-gray-800 border-b border-gray-700 p-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Add WhatsApp Group</h3>
                <button
                  onClick={() => setShowAddGroupModal(false)}
                  className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto max-h-[calc(80vh-80px)]">
                {availableGroups.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Users className="w-14 h-14 mx-auto mb-3 opacity-50" />
                    <p>No groups available</p>
                    <p className="text-sm mt-1 text-gray-500">Make sure WhatsApp is connected</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableGroups.map((group) => {
                      const isAdded = savedGroups.some(g => g.groupId === group.id);
                      return (
                        <div key={group.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between hover:border-gray-600 transition-colors">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium truncate">{group.name}</h4>
                          </div>
                          <button
                            onClick={() => handleAddGroup(group)}
                            disabled={isAdded || loading}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ml-3 ${
                              isAdded
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
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
        </AnimatePresence>,
        document.body
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && ReactDOM.createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4" onClick={() => setShowAddContactModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md"
            >
              <div className="bg-gray-800 border-b border-gray-700 p-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Add Contact</h3>
                <button
                  onClick={() => setShowAddContactModal(false)}
                  className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddContact} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contact Name</label>
                  <input
                    type="text"
                    value={addContactForm.contactName}
                    onChange={(e) => setAddContactForm({ ...addContactForm, contactName: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
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
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
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
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                    placeholder="e.g., Friend, Colleague"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Contact'}
                </button>
              </form>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* Summary Modal */}
      {showSummaryModal && selectedGroup && ReactDOM.createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4" onClick={() => setShowSummaryModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              <div className="bg-gray-800 border-b border-gray-700 p-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{selectedGroup.groupName}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRefreshGroupSummary(selectedGroup)}
                    disabled={refreshing}
                    className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowSummaryModal(false)}
                    className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-5 overflow-y-auto max-h-[calc(80vh-80px)]">
                {selectedGroup.lastSummary ? (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
                    <h4 className="text-white font-medium mb-3">Summary</h4>
                    <div className="text-gray-300 leading-relaxed space-y-3">
                      {selectedGroup.lastSummary.split('\n').map((line, idx) => {
                        if (!line.trim()) return null;
                        
                        // Parse markdown bold and render with proper styling
                        const parts = [];
                        let lastIndex = 0;
                        const boldRegex = /\*\*(.*?)\*\*/g;
                        let match;
                        
                        while ((match = boldRegex.exec(line)) !== null) {
                          // Add text before bold
                          if (match.index > lastIndex) {
                            parts.push({
                              text: line.substring(lastIndex, match.index),
                              bold: false,
                              key: `text-${idx}-${lastIndex}`
                            });
                          }
                          // Add bold text
                          parts.push({
                            text: match[1],
                            bold: true,
                            key: `bold-${idx}-${match.index}`
                          });
                          lastIndex = match.index + match[0].length;
                        }
                        
                        // Add remaining text
                        if (lastIndex < line.length) {
                          parts.push({
                            text: line.substring(lastIndex),
                            bold: false,
                            key: `text-${idx}-${lastIndex}`
                          });
                        }
                        
                        return (
                          <p key={`line-${idx}`} className="text-gray-300">
                            {parts.length > 0 ? (
                              parts.map(part => 
                                part.bold ? (
                                  <span key={part.key} className="font-semibold text-white">{part.text}</span>
                                ) : (
                                  <span key={part.key}>{part.text}</span>
                                )
                              )
                            ) : (
                              line
                            )}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <p>No summary available</p>
                    <p className="text-sm mt-1 text-gray-500">Click refresh to generate</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default WhatsAppDashboardSimple;
