const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  templateName: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  body: { type: String, required: true },
  isFollowUp: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema);
