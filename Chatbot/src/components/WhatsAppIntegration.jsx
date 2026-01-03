import React, { useState } from 'react';
import { MessageCircle, X, Send, Users, Clock, BarChart3, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';

const WHATSAPP_API_BASE = import.meta.env.VITE_WHATSAPP_API_BASE ;

const WhatsAppIntegration = ({ isOpen, onClose }) => {
  const [activeFeature, setActiveFeature] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  // Form states for different features
  const [fetchMessagesForm, setFetchMessagesForm] = useState({
    groupName: '',
    limit: 100
  });

  const [sendToGroupForm, setSendToGroupForm] = useState({
    groupName: '',
    content: ''
  });

  const [sendToNumberForm, setSendToNumberForm] = useState({
    sendMode: 'number', // 'contact' or 'number'
    contactName: '',
    phoneNumber: '',
    countryCode: '+91',
    content: '',
    scheduleTime: '',
    repeat: false,
    repeatInterval: 'daily',
    aiEnhance: false
  });

  const [aiMessageForm, setAiMessageForm] = useState({
    recipient: '',
    intent: '',
    context: ''
  });

  const [postStatusForm, setPostStatusForm] = useState({
    content: '',
    backgroundColor: '#4CAF50'
  });

  // AI Enhancement Preview State
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [aiEnhancedMessage, setAiEnhancedMessage] = useState('');
  const [originalMessage, setOriginalMessage] = useState('');

  const features = [
    {
      id: 'fetch-messages',
      name: 'Summarise Group Chats',
      icon: <FileText className="w-5 h-5" />,
      description: 'Get AI summary of WhatsApp group messages'
    },
    {
      id: 'send-to-group',
      name: 'Send to Group',
      icon: <Users className="w-5 h-5" />,
      description: 'Send message to a WhatsApp group'
    },
    {
      id: 'send-to-number',
      name: 'Send to Number',
      icon: <Send className="w-5 h-5" />,
      description: 'Send message to any phone number'
    },
    {
      id: 'ai-message',
      name: 'AI Message Generator',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Generate AI-powered messages'
    },
    {
      id: 'post-status',
      name: 'Post Status',
      icon: <Clock className="w-5 h-5" />,
      description: 'Post WhatsApp status/story'
    },
    {
      id: 'unread-messages',
      name: 'Unread Messages',
      icon: <MessageCircle className="w-5 h-5" />,
      description: 'View all unread messages'
    }
  ];

  const handleFetchMessages = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Step 1: Fetch messages from the group
      const response = await axios.post(`${WHATSAPP_API_BASE}/groups/messages/fetch`, {
        groupName: fetchMessagesForm.groupName,
        limit: fetchMessagesForm.limit
      });

      if (response.data.success) {
        const messagesData = response.data.data || {};
        const messages = messagesData.messages || [];
        const groupInfo = messagesData.groupInfo || {};
        
        console.log('Messages:', messages);
        
        if (messages.length === 0) {
          toast.warning('No messages found in this group!');
          return;
        }

        // Step 2: Prepare messages for AI summarization
        const messageTexts = messages
          .filter(msg => msg.content && !msg.isFromMe)
          .map(msg => `${msg.senderName || msg.senderPhone}: ${msg.content}`)
          .join('\n');

        // Step 3: Generate AI summary using Groq
        toast.info('Generating AI summary...');
        
        const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
        if (!groqApiKey) {
          toast.error('Groq API key not found!');
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
              content: `Summarize the following WhatsApp group conversation from "${fetchMessagesForm.groupName}" (${messages.length} messages):\n\n${messageTexts}`
            }
          ],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.7,
          max_tokens: 1000
        });

        const aiSummary = summaryResponse.choices[0]?.message?.content || 'No summary generated';
        
        // Step 4: Display results in UI
        toast.success(`Summary generated for ${messages.length} messages!`);
        
        const summary = response.data.summary || {};
        setSummaryData({
          groupName: fetchMessagesForm.groupName,
          totalMessages: summary.totalMessages || messages.length,
          uniqueSenders: summary.uniqueSenders || 'N/A',
          mediaMessages: summary.mediaMessages || 'N/A',
          aiSummary: aiSummary,
          messages: messages
        });
        setShowSummary(true);
      }
    } catch (error) {
      console.error('Error fetching/summarizing messages:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${WHATSAPP_API_BASE}/groups/send`, {
        groupName: sendToGroupForm.groupName,
        content: sendToGroupForm.content
      });

      if (response.data.success) {
        toast.success(`Message sent to ${sendToGroupForm.groupName} successfully!`);
        setSendToGroupForm({ groupName: '', content: '' });
      }
    } catch (error) {
      console.error('Error sending to group:', error);
      toast.error(error.response?.data?.message || 'Failed to send message to group');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToNumber = async (e) => {
    e.preventDefault();
    
    // If AI Enhancement is enabled and we haven't shown preview yet
    if (sendToNumberForm.aiEnhance && !aiEnhancedMessage) {
      setLoading(true);
      try {
        // Call AI enhancement API
        const enhanceResponse = await axios.post(`${WHATSAPP_API_BASE}/../ai/whatsapp/enhance`, {
          content: sendToNumberForm.content,
          platform: 'whatsapp',
          tone: 'friendly'
        });

        if (enhanceResponse.data.success) {
          setOriginalMessage(sendToNumberForm.content);
          setAiEnhancedMessage(enhanceResponse.data.data.enhancedContent);
          setShowAIPreview(true);
          setLoading(false);
          return; // Stop here and show preview
        }
      } catch (aiError) {
        console.error('AI Enhancement failed:', aiError);
        toast.error('AI enhancement failed. Sending original message.');
        // Continue with original message
      }
      setLoading(false);
    }

    setLoading(true);
    try {
      let finalPhoneNumber = '';
      let recipientName = '';
      
      // Use AI-enhanced message if available, otherwise use original
      const messageToSend = aiEnhancedMessage || sendToNumberForm.content;

      // Determine phone number based on send mode
      if (sendToNumberForm.sendMode === 'contact') {
        // Send to saved contact by name
        if (!sendToNumberForm.contactName) {
          toast.error('Please enter a contact name!');
          setLoading(false);
          return;
        }
        
        // Try to find contact via API
        try {
          const contactResponse = await axios.post(`${WHATSAPP_API_BASE}/contacts/send`, {
            contactName: sendToNumberForm.contactName,
            content: messageToSend
          });
          
          if (contactResponse.data.success) {
            toast.success(`Message sent to ${sendToNumberForm.contactName} successfully!`);
            setSendToNumberForm({
              sendMode: 'number',
              contactName: '',
              phoneNumber: '',
              countryCode: '+91',
              content: '',
              scheduleTime: '',
              repeat: false,
              repeatInterval: 'daily',
              aiEnhance: false
            });
            setAiEnhancedMessage('');
            setOriginalMessage('');
            setLoading(false);
            return;
          }
        } catch (contactError) {
          // Check if it's a 404 (endpoint not found) or 500 (backend not configured)
          if (contactError.response?.status === 404 || contactError.response?.status === 500) {
            toast.warning('WhatsApp service not fully configured. Message logged to console.');
            console.log('📱 Message to Contact (Simulated):', {
              contactName: sendToNumberForm.contactName,
              content: messageToSend,
              timestamp: new Date().toISOString()
            });
            setSendToNumberForm({
              sendMode: 'number',
              contactName: '',
              phoneNumber: '',
              countryCode: '+91',
              content: '',
              scheduleTime: '',
              repeat: false,
              repeatInterval: 'daily',
              aiEnhance: false
            });
            setAiEnhancedMessage('');
            setOriginalMessage('');
            setLoading(false);
            return;
          }
          toast.error(contactError.response?.data?.message || 'Contact not found. Try using phone number instead.');
          setLoading(false);
          return;
        }
      } else {
        // Send to phone number
        finalPhoneNumber = sendToNumberForm.countryCode + sendToNumberForm.phoneNumber.replace(/^[+\s]/, '');
        recipientName = sendToNumberForm.contactName || finalPhoneNumber;
      }

      // Check if scheduling is enabled
      if (sendToNumberForm.scheduleTime) {
        const scheduleDate = new Date(sendToNumberForm.scheduleTime);
        const now = new Date();
        
        if (scheduleDate <= now) {
          toast.error('Schedule time must be in the future!');
          setLoading(false);
          return;
        }

        // Schedule the message via backend
        try {
          const scheduleResponse = await axios.post(`${WHATSAPP_API_BASE}/messages/schedule`, {
            sendMode: sendToNumberForm.sendMode,
            phoneNumber: finalPhoneNumber,
            contactName: sendToNumberForm.contactName,
            content: sendToNumberForm.content,
            scheduleTime: scheduleDate.toISOString(),
            repeat: sendToNumberForm.repeat,
            repeatInterval: sendToNumberForm.repeatInterval,
            aiEnhance: sendToNumberForm.aiEnhance
          });

          if (scheduleResponse.data.success) {
            toast.success(`Message scheduled for ${scheduleDate.toLocaleString()}${sendToNumberForm.repeat ? ` (${sendToNumberForm.repeatInterval})` : ''}${sendToNumberForm.aiEnhance ? ' with AI enhancement' : ''}!`);
            setSendToNumberForm({
              sendMode: 'number',
              contactName: '',
              phoneNumber: '',
              countryCode: '+91',
              content: '',
              scheduleTime: '',
              repeat: false,
              repeatInterval: 'daily',
              aiEnhance: false
            });
          }
        } catch (scheduleError) {
          console.error('Error scheduling message:', scheduleError);
          toast.error(scheduleError.response?.data?.message || 'Failed to schedule message');
        }
      } else {
        // Send immediately to phone number
        try {
          const response = await axios.post(`${WHATSAPP_API_BASE}/messages/send-to-number`, {
            phoneNumber: finalPhoneNumber,
            content: messageToSend
          });

          if (response.data.success) {
            toast.success(`Message sent to ${recipientName} successfully!`);
            setSendToNumberForm({
              sendMode: 'number',
              contactName: '',
              phoneNumber: '',
              countryCode: '+91',
              content: '',
              scheduleTime: '',
              repeat: false,
              repeatInterval: 'daily',
              aiEnhance: false
            });
            setAiEnhancedMessage('');
            setOriginalMessage('');
          }
        } catch (sendError) {
          // If backend is not configured (500 error), simulate the message
          if (sendError.response?.status === 500) {
            toast.warning('WhatsApp service not fully configured. Message logged to console.');
            console.log('📱 Message to Number (Simulated):', {
              phoneNumber: finalPhoneNumber,
              recipientName: recipientName,
              content: messageToSend,
              timestamp: new Date().toISOString(),
              note: 'WhatsApp backend API not configured. Connect to WhatsApp Business API or Chatwoot to enable actual sending.'
            });
            setSendToNumberForm({
              sendMode: 'number',
              contactName: '',
              phoneNumber: '',
              countryCode: '+91',
              content: '',
              scheduleTime: '',
              repeat: false,
              repeatInterval: 'daily',
              aiEnhance: false
            });
            setAiEnhancedMessage('');
            setOriginalMessage('');
          } else {
            throw sendError;
          }
        }
      }
    } catch (error) {
      console.error('Error sending to number:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleAIMessage = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const contextObj = aiMessageForm.context ? JSON.parse(aiMessageForm.context) : {};
      
      const response = await axios.post(`${WHATSAPP_API_BASE}/../ai/whatsapp/message`, {
        recipient: aiMessageForm.recipient,
        intent: aiMessageForm.intent,
        context: contextObj
      });

      if (response.data.success) {
        toast.success('AI message generated!');
        const generatedMessage = response.data.data.message;
        alert(`Generated Message:\n\n${generatedMessage}\n\nYou can now copy and send this message!`);
      }
    } catch (error) {
      console.error('Error generating AI message:', error);
      toast.error(error.response?.data?.message || 'Failed to generate AI message');
    } finally {
      setLoading(false);
    }
  };

  const handlePostStatus = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${WHATSAPP_API_BASE}/status/post`, {
        content: postStatusForm.content,
        backgroundColor: postStatusForm.backgroundColor
      });

      if (response.data.success) {
        toast.success('Status posted successfully!');
        setPostStatusForm({ content: '', backgroundColor: '#4CAF50' });
      }
    } catch (error) {
      console.error('Error posting status:', error);
      toast.error(error.response?.data?.message || 'Failed to post status');
    } finally {
      setLoading(false);
    }
  };

  const handleUnreadMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${WHATSAPP_API_BASE}/messages/unread?limit=50`);

      if (response.data.success) {
        const summary = response.data.summary;
        toast.success(`Found ${summary.unreadCount} unread messages!`);
        alert(`Unread Messages Summary:\n\nTotal Unread: ${summary.unreadCount}\nGroup Messages: ${summary.groupMessages}\nIndividual Messages: ${summary.individualMessages}\nUnique Contacts: ${summary.fromUniqueContacts}`);
        console.log('Unread messages:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch unread messages');
    } finally {
      setLoading(false);
    }
  };

  const renderFeatureForm = () => {
    switch (activeFeature) {
      case 'fetch-messages':
        return (
          <form onSubmit={handleFetchMessages} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={fetchMessagesForm.groupName}
                onChange={(e) => setFetchMessagesForm({ ...fetchMessagesForm, groupName: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter group name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message Limit
              </label>
              <input
                type="number"
                value={fetchMessagesForm.limit}
                onChange={(e) => setFetchMessagesForm({ ...fetchMessagesForm, limit: parseInt(e.target.value) })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="100"
                min="1"
                max="1000"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Summarising...' : 'Summarise Group'}
            </button>
          </form>
        );

      case 'send-to-group':
        return (
          <form onSubmit={handleSendToGroup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={sendToGroupForm.groupName}
                onChange={(e) => setSendToGroupForm({ ...sendToGroupForm, groupName: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter group name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={sendToGroupForm.content}
                onChange={(e) => setSendToGroupForm({ ...sendToGroupForm, content: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[100px]"
                placeholder="Enter your message"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send to Group'}
            </button>
          </form>
        );

      case 'send-to-number':
        return (
          <form onSubmit={handleSendToNumber} className="space-y-4">
            {/* Toggle between Contact and Phone Number */}
            <div className="flex items-center gap-4 bg-gray-700 p-3 rounded-lg">
              <span className="text-sm text-gray-300">Send to:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSendToNumberForm({ ...sendToNumberForm, sendMode: 'contact' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sendToNumberForm.sendMode === 'contact'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  Saved Contact
                </button>
                <button
                  type="button"
                  onClick={() => setSendToNumberForm({ ...sendToNumberForm, sendMode: 'number' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sendToNumberForm.sendMode === 'number'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  Phone Number
                </button>
              </div>
            </div>

            {/* Contact Name Field (for saved contact mode) */}
            {sendToNumberForm.sendMode === 'contact' ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={sendToNumberForm.contactName}
                  onChange={(e) => setSendToNumberForm({ ...sendToNumberForm, contactName: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., John Doe"
                  required
                />
                <p className="text-gray-400 text-xs mt-1">Enter the name as saved in your WhatsApp contacts</p>
              </div>
            ) : (
              <>
                {/* Optional Label for Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Label (Optional)
                  </label>
                  <input
                    type="text"
                    value={sendToNumberForm.contactName}
                    onChange={(e) => setSendToNumberForm({ ...sendToNumberForm, contactName: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., John Doe (for your reference)"
                  />
                </div>

                {/* Phone Number with Country Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={sendToNumberForm.countryCode}
                      onChange={(e) => setSendToNumberForm({ ...sendToNumberForm, countryCode: e.target.value })}
                      className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="+91">+91 (India)</option>
                      <option value="+1">+1 (US/Canada)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+971">+971 (UAE)</option>
                      <option value="+61">+61 (Australia)</option>
                      <option value="+65">+65 (Singapore)</option>
                      <option value="+86">+86 (China)</option>
                      <option value="+81">+81 (Japan)</option>
                      <option value="">Custom</option>
                    </select>
                    <input
                      type="tel"
                      value={sendToNumberForm.phoneNumber}
                      onChange={(e) => setSendToNumberForm({ ...sendToNumberForm, phoneNumber: e.target.value.replace(/\D/g, '') })}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="9876543210"
                      required
                    />
                  </div>
                  <p className="text-gray-400 text-xs mt-1">Enter number without country code</p>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={sendToNumberForm.content}
                onChange={(e) => setSendToNumberForm({ ...sendToNumberForm, content: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[100px]"
                placeholder="Enter your message"
                required
              />
              
              {/* AI Enhancement Toggle */}
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="ai-enhance"
                  checked={sendToNumberForm.aiEnhance}
                  onChange={(e) => setSendToNumberForm({ ...sendToNumberForm, aiEnhance: e.target.checked })}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="ai-enhance" className="text-sm text-gray-300 flex items-center gap-1">
                  <span className="text-purple-400">✨</span> AI Enhancement (Groq)
                </label>
              </div>
              <p className="text-gray-400 text-xs mt-1">Enable to enhance your message with AI before sending</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Schedule Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={sendToNumberForm.scheduleTime}
                onChange={(e) => setSendToNumberForm({ ...sendToNumberForm, scheduleTime: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-gray-400 text-xs mt-1">Leave empty to send immediately (future dates only)</p>
            </div>
            {sendToNumberForm.scheduleTime && (
              <>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="repeat-number"
                    checked={sendToNumberForm.repeat}
                    onChange={(e) => setSendToNumberForm({ ...sendToNumberForm, repeat: e.target.checked })}
                    className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                  />
                  <label htmlFor="repeat-number" className="text-sm text-gray-300">
                    Repeat message
                  </label>
                </div>
                {sendToNumberForm.repeat && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Repeat Interval
                    </label>
                    <select
                      value={sendToNumberForm.repeatInterval}
                      onChange={(e) => setSendToNumberForm({ ...sendToNumberForm, repeatInterval: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}
              </>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (sendToNumberForm.scheduleTime ? 'Scheduling...' : 'Sending...') : (sendToNumberForm.scheduleTime ? 'Schedule Message' : 'Send Now')}
            </button>
          </form>
        );

      case 'ai-message':
        return (
          <form onSubmit={handleAIMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient Name
              </label>
              <input
                type="text"
                value={aiMessageForm.recipient}
                onChange={(e) => setAiMessageForm({ ...aiMessageForm, recipient: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., John"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Intent/Purpose
              </label>
              <input
                type="text"
                value={aiMessageForm.intent}
                onChange={(e) => setAiMessageForm({ ...aiMessageForm, intent: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., catch up with friend"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Context (JSON format - optional)
              </label>
              <textarea
                value={aiMessageForm.context}
                onChange={(e) => setAiMessageForm({ ...aiMessageForm, context: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[80px]"
                placeholder='{"relation": "friend", "lastContact": "2 months ago"}'
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate AI Message'}
            </button>
          </form>
        );

      case 'post-status':
        return (
          <form onSubmit={handlePostStatus} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status Content
              </label>
              <textarea
                value={postStatusForm.content}
                onChange={(e) => setPostStatusForm({ ...postStatusForm, content: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[100px]"
                placeholder="What's on your mind?"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Background Color
              </label>
              <input
                type="color"
                value={postStatusForm.backgroundColor}
                onChange={(e) => setPostStatusForm({ ...postStatusForm, backgroundColor: e.target.value })}
                className="w-full h-12 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 cursor-pointer"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : 'Post Status'}
            </button>
          </form>
        );

      case 'unread-messages':
        return (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Click the button below to fetch all your unread WhatsApp messages.
            </p>
            <button
              onClick={handleUnreadMessages}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Fetching...' : 'Get Unread Messages'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* WhatsApp Popup Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
            onClick={() => {
              onClose();
              setActiveFeature(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">WhatsApp Integration</h2>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    setActiveFeature(null);
                  }}
                  className="text-white hover:bg-green-700 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {!activeFeature ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature) => (
                      <motion.button
                        key={feature.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveFeature(feature.id)}
                        className="bg-gray-700 hover:bg-gray-600 p-6 rounded-lg text-left transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="bg-green-600 p-3 rounded-lg">
                            {feature.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-semibold mb-1">{feature.name}</h3>
                            <p className="text-gray-400 text-sm">{feature.description}</p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={() => setActiveFeature(null)}
                      className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
                    >
                      ← Back to features
                    </button>
                    <h3 className="text-white text-xl font-semibold mb-4">
                      {features.find(f => f.id === activeFeature)?.name}
                    </h3>
                    {renderFeatureForm()}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Display Modal */}
      <AnimatePresence>
        {showSummary && summaryData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowSummary(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Group Summary</h2>
                </div>
                <button
                  onClick={() => setShowSummary(false)}
                  className="text-white hover:bg-green-800 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Group Info */}
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <h3 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-500" />
                    {summaryData.groupName}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-500">{summaryData.totalMessages}</div>
                      <div className="text-gray-400 text-sm mt-1">Total Messages</div>
                    </div>
                    {summaryData.uniqueSenders !== 'N/A' && (
                      <div className="bg-gray-800 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-500">{summaryData.uniqueSenders}</div>
                        <div className="text-gray-400 text-sm mt-1">Unique Senders</div>
                      </div>
                    )}
                    {summaryData.mediaMessages !== 'N/A' && (
                      <div className="bg-gray-800 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-500">{summaryData.mediaMessages}</div>
                        <div className="text-gray-400 text-sm mt-1">Media Messages</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Summary */}
                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-500" />
                    AI-Generated Summary
                  </h3>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div 
                      className="text-gray-300 whitespace-pre-wrap leading-relaxed prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: summaryData.aiSummary
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.+?)\*/g, '<em>$1</em>')
                          .replace(/\n/g, '<br/>')
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(summaryData.aiSummary);
                      toast.success('Summary copied to clipboard!');
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Copy Summary
                  </button>
                  <button
                    onClick={() => setShowSummary(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Enhancement Preview Modal */}
      <AnimatePresence>
        {showAIPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={() => {
              setShowAIPreview(false);
              setAiEnhancedMessage('');
              setOriginalMessage('');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-purple-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="text-3xl">✨</span> AI Enhanced Message
                  </h2>
                  <button
                    onClick={() => {
                      setShowAIPreview(false);
                      setAiEnhancedMessage('');
                      setOriginalMessage('');
                    }}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-purple-100 text-sm mt-2">Powered by Groq AI</p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Original Message */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-gray-400 text-sm font-medium mb-2 flex items-center gap-2">
                    <span>📝</span> Original Message
                  </h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{originalMessage}</p>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="text-purple-400 text-2xl">↓</div>
                </div>

                {/* Enhanced Message */}
                <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-500/50">
                  <h3 className="text-purple-300 text-sm font-medium mb-2 flex items-center gap-2">
                    <span>✨</span> AI Enhanced Message
                  </h3>
                  <p className="text-white whitespace-pre-wrap font-medium">{aiEnhancedMessage}</p>
                </div>

                {/* Info */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-blue-300 text-sm">
                    💡 The AI has enhanced your message to be more engaging and professional. Click "Send Enhanced Message" to proceed.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 bg-gray-800/50 rounded-b-2xl flex gap-3">
                <button
                  onClick={() => {
                    setShowAIPreview(false);
                    setAiEnhancedMessage('');
                    setOriginalMessage('');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAIPreview(false);
                    // Trigger send with enhanced message
                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                    document.querySelector('form').dispatchEvent(submitEvent);
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-lg shadow-purple-500/30"
                >
                  ✨ Send Enhanced Message
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WhatsAppIntegration;
