const express = require('express');
const router = express.Router();
const WhatsAppData = require('../Schema/WhatsAppDataSchema');
const User = require('../Schema/UserSchema');

// Get user's WhatsApp data
router.get('/data/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    let whatsappData = await WhatsAppData.findOne({ userId: user._id });
    
    // Create new WhatsApp data if doesn't exist
    if (!whatsappData) {
      whatsappData = new WhatsAppData({
        userId: user._id,
        username: username,
        savedGroups: [],
        savedContacts: [],
        whatsappAccount: {},
        statistics: {}
      });
      await whatsappData.save();
    }
    
    res.json({
      success: true,
      data: whatsappData
    });
  } catch (error) {
    console.error('Error fetching WhatsApp data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add or update a saved group
router.post('/groups/save', async (req, res) => {
  try {
    const { username, groupId, groupName, summary, messageCount } = req.body;
    
    if (!username || !groupId || !groupName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: username, groupId, groupName' 
      });
    }
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    let whatsappData = await WhatsAppData.findOne({ userId: user._id });
    
    if (!whatsappData) {
      whatsappData = new WhatsAppData({
        userId: user._id,
        username: username,
        savedGroups: [],
        savedContacts: []
      });
    }
    
    // Check if group already exists
    const existingGroupIndex = whatsappData.savedGroups.findIndex(
      g => g.groupId === groupId
    );
    
    if (existingGroupIndex !== -1) {
      // Update existing group
      whatsappData.savedGroups[existingGroupIndex].groupName = groupName;
      if (summary) {
        whatsappData.savedGroups[existingGroupIndex].lastSummary = summary;
        whatsappData.savedGroups[existingGroupIndex].lastSummaryDate = new Date();
      }
      if (messageCount) {
        whatsappData.savedGroups[existingGroupIndex].messageCount = messageCount;
      }
      whatsappData.savedGroups[existingGroupIndex].lastFetchDate = new Date();
    } else {
      // Add new group
      whatsappData.savedGroups.push({
        groupId,
        groupName,
        lastSummary: summary || '',
        lastSummaryDate: summary ? new Date() : null,
        lastFetchDate: new Date(),
        messageCount: messageCount || 0,
        isActive: true,
        addedAt: new Date()
      });
    }
    
    // Update statistics
    if (summary) {
      whatsappData.statistics.totalGroupsSummarized = 
        (whatsappData.statistics.totalGroupsSummarized || 0) + 1;
    }
    whatsappData.statistics.lastActivityDate = new Date();
    
    await whatsappData.save();
    
    res.json({
      success: true,
      message: existingGroupIndex !== -1 ? 'Group updated' : 'Group saved',
      data: whatsappData
    });
  } catch (error) {
    console.error('Error saving group:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove a saved group
router.delete('/groups/remove', async (req, res) => {
  try {
    const { username, groupId } = req.body;
    
    if (!username || !groupId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: username, groupId' 
      });
    }
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const whatsappData = await WhatsAppData.findOne({ userId: user._id });
    if (!whatsappData) {
      return res.status(404).json({ success: false, message: 'WhatsApp data not found' });
    }
    
    whatsappData.savedGroups = whatsappData.savedGroups.filter(
      g => g.groupId !== groupId
    );
    
    await whatsappData.save();
    
    res.json({
      success: true,
      message: 'Group removed',
      data: whatsappData
    });
  } catch (error) {
    console.error('Error removing group:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add or update a saved contact
router.post('/contacts/save', async (req, res) => {
  try {
    const { username, contactName, phoneNumber, chatId, label } = req.body;
    
    if (!username || !contactName || !phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: username, contactName, phoneNumber' 
      });
    }
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    let whatsappData = await WhatsAppData.findOne({ userId: user._id });
    
    if (!whatsappData) {
      whatsappData = new WhatsAppData({
        userId: user._id,
        username: username,
        savedGroups: [],
        savedContacts: []
      });
    }
    
    // Check if contact already exists
    const existingContactIndex = whatsappData.savedContacts.findIndex(
      c => c.phoneNumber === phoneNumber || c.contactName === contactName
    );
    
    if (existingContactIndex !== -1) {
      // Update existing contact
      whatsappData.savedContacts[existingContactIndex].contactName = contactName;
      whatsappData.savedContacts[existingContactIndex].phoneNumber = phoneNumber;
      if (chatId) whatsappData.savedContacts[existingContactIndex].chatId = chatId;
      if (label) whatsappData.savedContacts[existingContactIndex].label = label;
    } else {
      // Add new contact
      whatsappData.savedContacts.push({
        contactName,
        phoneNumber,
        chatId: chatId || '',
        label: label || '',
        lastMessageDate: null,
        messageCount: 0,
        isActive: true,
        addedAt: new Date()
      });
    }
    
    whatsappData.statistics.lastActivityDate = new Date();
    await whatsappData.save();
    
    res.json({
      success: true,
      message: existingContactIndex !== -1 ? 'Contact updated' : 'Contact saved',
      data: whatsappData
    });
  } catch (error) {
    console.error('Error saving contact:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove a saved contact
router.delete('/contacts/remove', async (req, res) => {
  try {
    const { username, phoneNumber } = req.body;
    
    if (!username || !phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: username, phoneNumber' 
      });
    }
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const whatsappData = await WhatsAppData.findOne({ userId: user._id });
    if (!whatsappData) {
      return res.status(404).json({ success: false, message: 'WhatsApp data not found' });
    }
    
    whatsappData.savedContacts = whatsappData.savedContacts.filter(
      c => c.phoneNumber !== phoneNumber
    );
    
    await whatsappData.save();
    
    res.json({
      success: true,
      message: 'Contact removed',
      data: whatsappData
    });
  } catch (error) {
    console.error('Error removing contact:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update message statistics
router.post('/statistics/update', async (req, res) => {
  try {
    const { username, messagesSent, messagesReceived } = req.body;
    
    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field: username' 
      });
    }
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    let whatsappData = await WhatsAppData.findOne({ userId: user._id });
    
    if (!whatsappData) {
      whatsappData = new WhatsAppData({
        userId: user._id,
        username: username,
        savedGroups: [],
        savedContacts: []
      });
    }
    
    if (messagesSent) {
      whatsappData.statistics.totalMessagesSent = 
        (whatsappData.statistics.totalMessagesSent || 0) + messagesSent;
    }
    
    if (messagesReceived) {
      whatsappData.statistics.totalMessagesReceived = 
        (whatsappData.statistics.totalMessagesReceived || 0) + messagesReceived;
    }
    
    whatsappData.statistics.lastActivityDate = new Date();
    await whatsappData.save();
    
    res.json({
      success: true,
      message: 'Statistics updated',
      data: whatsappData
    });
  } catch (error) {
    console.error('Error updating statistics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update WhatsApp account info
router.post('/account/update', async (req, res) => {
  try {
    const { username, accountId, phoneNumber, isConnected } = req.body;
    
    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field: username' 
      });
    }
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    let whatsappData = await WhatsAppData.findOne({ userId: user._id });
    
    if (!whatsappData) {
      whatsappData = new WhatsAppData({
        userId: user._id,
        username: username,
        savedGroups: [],
        savedContacts: []
      });
    }
    
    if (accountId) whatsappData.whatsappAccount.accountId = accountId;
    if (phoneNumber) whatsappData.whatsappAccount.phoneNumber = phoneNumber;
    if (typeof isConnected === 'boolean') {
      whatsappData.whatsappAccount.isConnected = isConnected;
      if (isConnected) {
        whatsappData.whatsappAccount.lastConnected = new Date();
      }
    }
    
    await whatsappData.save();
    
    res.json({
      success: true,
      message: 'Account info updated',
      data: whatsappData
    });
  } catch (error) {
    console.error('Error updating account info:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
