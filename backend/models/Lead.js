const mongoose = require('mongoose');

const STATUSES = ['Ready', 'Email Sent', 'Replied', 'Interested', 'Client'];

const leadSchema = new mongoose.Schema({
  brandName: { type: String, required: true, trim: true },
  contactName: { type: String, trim: true, default: '' },
  email: { type: String, required: true, lowercase: true, trim: true },
  website: { type: String, trim: true, default: '' },
  productType: { type: String, trim: true, default: '' },
  status: { type: String, enum: STATUSES, default: 'Ready' },
  notes: { type: String, default: '' },
  lastContacted: { type: Date, default: null },
  followUpCount: { type: Number, default: 0 },
  lastFollowUp: { type: Date, default: null },
}, { timestamps: true });

leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });

module.exports = mongoose.model('Lead', leadSchema);
