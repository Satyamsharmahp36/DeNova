const mongoose = require('mongoose');

const aiActionLogSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  actionType: { 
    type: String, 
    required: true,
    enum: ['WHATSAPP_SEND_MESSAGE', 'LINKEDIN_POST', 'TWITTER_POST', 'EMAIL_SEND', 'OTHER']
  },
  actionDetails: {
    recipient: { type: String },
    content: { type: String },
    platform: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'executed', 'failed', 'rejected'],
    default: 'pending'
  },
  walletSignature: {
    signature: { type: String },
    publicKey: { type: String },
    message: { type: String },
    timestamp: { type: Date }
  },
  executionResult: {
    success: { type: Boolean },
    message: { type: String },
    executedAt: { type: Date },
    errorDetails: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

aiActionLogSchema.index({ username: 1, createdAt: -1 });
aiActionLogSchema.index({ status: 1, createdAt: -1 });

const AIActionLog = mongoose.model('AIActionLog', aiActionLogSchema);

module.exports = AIActionLog;
