const mongoose = require('mongoose');

const whatsappDataSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  username: { 
    type: String, 
    required: true 
  },
  
  // Saved WhatsApp Groups
  savedGroups: [{
    groupId: { type: String, required: true },
    groupName: { type: String, required: true },
    lastSummary: { type: String, default: '' },
    lastSummaryDate: { type: Date },
    lastFetchDate: { type: Date },
    messageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Saved WhatsApp Contacts
  savedContacts: [{
    contactName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    chatId: { type: String },
    label: { type: String }, // Optional label for the contact
    lastMessageDate: { type: Date },
    messageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    addedAt: { type: Date, default: Date.now }
  }],
  
  // WhatsApp Account Info
  whatsappAccount: {
    accountId: { type: String },
    phoneNumber: { type: String },
    isConnected: { type: Boolean, default: false },
    lastConnected: { type: Date }
  },
  
  // Message Statistics
  statistics: {
    totalMessagesSent: { type: Number, default: 0 },
    totalMessagesReceived: { type: Number, default: 0 },
    totalGroupsSummarized: { type: Number, default: 0 },
    lastActivityDate: { type: Date }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
whatsappDataSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for faster queries
whatsappDataSchema.index({ userId: 1 });
whatsappDataSchema.index({ username: 1 });
whatsappDataSchema.index({ 'savedGroups.groupId': 1 });
whatsappDataSchema.index({ 'savedContacts.phoneNumber': 1 });

const WhatsAppData = mongoose.model('WhatsAppData', whatsappDataSchema);

module.exports = WhatsAppData;
