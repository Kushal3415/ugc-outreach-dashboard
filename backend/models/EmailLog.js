const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  recipientEmail: { type: String, required: true },
  recipientName: { type: String, default: '' },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  error: { type: String, default: '' },
  isFollowUp: { type: Boolean, default: false },
  sentAt: { type: Date, default: Date.now },
}, { timestamps: true });

emailLogSchema.index({ leadId: 1 });
emailLogSchema.index({ sentAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
