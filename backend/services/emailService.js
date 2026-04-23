const nodemailer = require('nodemailer');
const Lead = require('../models/Lead');
const EmailLog = require('../models/EmailLog');

const BACKEND_URL = process.env.BACKEND_URL || 'https://ugc-outreach-dashboard-1.onrender.com';

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

const interpolate = (text, lead) =>
  text
    .replace(/\{Brand Name\}/gi, lead.brandName || '')
    .replace(/\{Contact Name\}/gi, lead.contactName || '')
    .replace(/\{Product Type\}/gi, lead.productType || '');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomDelay = () => Math.floor(Math.random() * (120000 - 60000 + 1)) + 60000;

// Build HTML with tracking pixel embedded
const buildHtml = (body, logId) => {
  const textHtml = body.replace(/\n/g, '<br>');
  const pixelUrl = `${BACKEND_URL}/api/track/${logId}`;
  return `${textHtml}<img src="${pixelUrl}" width="1" height="1" style="display:none;border:0;" alt="" />`;
};

const sendOne = async (transporter, lead, subject, body, isFollowUp = false) => {
  const filledSubject = interpolate(subject, lead);
  const filledBody = interpolate(body, lead);

  // Create log first so we have an ID for the tracking pixel
  const log = await EmailLog.create({
    leadId: lead._id,
    subject: filledSubject,
    message: filledBody,
    recipientEmail: lead.email,
    recipientName: lead.contactName || lead.brandName,
    isFollowUp,
    status: 'sent',
  });

  try {
    await transporter.sendMail({
      from: `${process.env.GMAIL_USER}`,
      replyTo: process.env.GMAIL_USER,
      to: lead.email,
      subject: filledSubject,
      text: filledBody,
      html: buildHtml(filledBody, log._id),
      headers: {
        'X-Mailer': 'Nodemailer',
        'X-Priority': '3',
        'List-Unsubscribe': `<mailto:${process.env.GMAIL_USER}?subject=Unsubscribe>`,
        'Precedence': 'bulk',
      },
    });
    return 'sent';
  } catch (err) {
    await EmailLog.findByIdAndUpdate(log._id, { status: 'failed', error: err.message });
    return 'failed';
  }
};

const sendBulk = async (templateSubject, templateBody) => {
  const leads = await Lead.find({ status: 'Ready' }).limit(50);
  if (!leads.length) return { sent: 0, failed: 0, total: 0 };

  const transporter = createTransporter();
  const results = { sent: 0, failed: 0, total: leads.length };

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const status = await sendOne(transporter, lead, templateSubject, templateBody);

    if (status === 'sent') {
      results.sent++;
      await Lead.findByIdAndUpdate(lead._id, { status: 'Email Sent', lastContacted: new Date() });
    } else {
      results.failed++;
    }

    if (i < leads.length - 1) await sleep(randomDelay());
  }

  return results;
};

const sendFollowUps = async (templateSubject, templateBody) => {
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

    if (i < leads.length - 1) await sleep(randomDelay());
  }

  return results;
};

module.exports = { sendBulk, sendFollowUps };
