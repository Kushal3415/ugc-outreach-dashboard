const Template = require('../models/Template');
const { sendBulk, sendFollowUps } = require('../services/emailService');

// POST /api/emails/send-bulk  { templateId }
const bulkSend = async (req, res) => {
  try {
    const { templateId } = req.body;
    if (!templateId) return res.status(400).json({ message: 'templateId is required' });

    const template = await Template.findById(templateId);
    if (!template) return res.status(404).json({ message: 'Template not found' });

    // Respond immediately — emails send in background with delays
    res.json({ message: 'Bulk email job started', templateName: template.templateName });

    // Fire and forget (delays can be 60–120s per email)
    sendBulk(template.subject, template.body).catch((err) =>
      console.error('Bulk send error:', err.message)
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/emails/send-followup  { templateId }
const followUpSend = async (req, res) => {
  try {
    const { templateId } = req.body;
    if (!templateId) return res.status(400).json({ message: 'templateId is required' });

    const template = await Template.findById(templateId);
    if (!template) return res.status(404).json({ message: 'Template not found' });

    res.json({ message: 'Follow-up email job started', templateName: template.templateName });

    sendFollowUps(template.subject, template.body).catch((err) =>
      console.error('Follow-up send error:', err.message)
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/emails/followup-candidates — leads eligible for follow-up
const getFollowUpCandidates = async (req, res) => {
  try {
    const Lead = require('../models/Lead');
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const leads = await Lead.find({
      status: 'Email Sent',
      lastContacted: { $lte: threeDaysAgo },
    });
    res.json({ count: leads.length, leads });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { bulkSend, followUpSend, getFollowUpCandidates };
