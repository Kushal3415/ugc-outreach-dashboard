const nodemailer = require('nodemailer');
const Lead = require('../models/Lead');
const EmailLog = require('../models/EmailLog');

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

// Replace {Brand Name}, {Contact Name}, {Product Type} placeholders
const interpolate = (text, lead) =>
  text
    .replace(/\{Brand Name\}/gi, lead.brandName || '')
    .replace(/\{Contact Name\}/gi, lead.contactName || '')
    .replace(/\{Product Type\}/gi, lead.productType || '');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const randomDelay = () => Math.floor(Math.random() * (120000 - 60000 + 1)) + 60000; // 60–120s

/**
 * Send a single email and log the result.
 */
const sendOne = async (transporter, lead, subject, body, isFollowUp = false) => {
  const filledSubject = interpolate(subject, lead);
  const filledBody = interpolate(body, lead);

  const logData = {
    leadId: lead._id,
    subject: filledSubject,
    message: filledBody,
    recipientEmail: lead.email,
    recipientName: lead.contactName || lead.brandName,
    isFollowUp,
  };

  try {
    await transporter.sendMail({
      from: `"UGC Outreach" <${process.env.GMAIL_USER}>`,
      to: lead.email,
      subject: filledSubject,
      text: filledBody,
      html: filledBody.replace(/\n/g, '<br>'),
    });
    logData.status = 'sent';
  } catch (err) {
    logData.status = 'failed';
    logData.error = err.message;
  }

  await EmailLog.create(logData);
  return logData.status;
};

/**
 * Bulk send to Ready leads (max 50 per batch, 60–120s delay between each).
 */
const sendBulk = async (templateSubject, templateBody, onProgress) => {
  const leads = await Lead.find({ status: 'Ready' }).limit(50);
  if (!leads.length) return { sent: 0, failed: 0, total: 0 };

  const transporter = createTransporter();
  const results = { sent: 0, failed: 0, total: leads.length };

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const status = await sendOne(transporter, lead, templateSubject, templateBody);

    if (status === 'sent') {
      results.sent++;
      await Lead.findByIdAndUpdate(lead._id, {
        status: 'Email Sent',
        lastContacted: new Date(),
      });
    } else {
      results.failed++;
    }

    if (onProgress) onProgress({ index: i + 1, total: leads.length, leadEmail: lead.email, status });

    // Delay between sends (skip delay after last email)
    if (i < leads.length - 1) {
      await sleep(randomDelay());
    }
  }

  return results;
};

/**
 * Send follow-up emails to leads where lastContacted > 3 days ago and status = Email Sent.
 */
const sendFollowUps = async (templateSubject, templateBody, onProgress) => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const leads = await Lead.find({
    status: 'Email Sent',
    lastContacted: { $lte: threeDaysAgo },
  }).limit(50);

  if (!leads.length) return { sent: 0, failed: 0, total: 0 };

  const transporter = createTransporter();
  const results = { sent: 0, failed: 0, total: leads.length };

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const status = await sendOne(transporter, lead, templateSubject, templateBody, true);

    if (status === 'sent') {
      results.sent++;
      await Lead.findByIdAndUpdate(lead._id, {
        lastContacted: new Date(),
        lastFollowUp: new Date(),
        $inc: { followUpCount: 1 },
      });
    } else {
      results.failed++;
    }

    if (onProgress) onProgress({ index: i + 1, total: leads.length, leadEmail: lead.email, status });

    if (i < leads.length - 1) {
      await sleep(randomDelay());
    }
  }

  return results;
};

module.exports = { sendBulk, sendFollowUps };
