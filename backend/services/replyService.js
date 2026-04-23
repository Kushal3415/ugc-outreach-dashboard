const { ImapFlow } = require('imapflow');
const Lead = require('../models/Lead');

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

const checkForReplies = async () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) return;

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
    logger: false,
  });

  try {
    await client.connect();
    await client.mailboxOpen('INBOX');

    // Get all leads that are in "Email Sent" status
    const sentLeads = await Lead.find({ status: 'Email Sent' }).select('email _id');
    if (!sentLeads.length) {
      await client.logout();
      return;
    }

    const emailSet = new Set(sentLeads.map((l) => l.email.toLowerCase()));
    let repliesFound = 0;

    // Search for unseen messages from any of our leads
    for await (const msg of client.fetch('1:*', { envelope: true })) {
      const fromAddr = msg.envelope?.from?.[0]?.address?.toLowerCase();
      if (fromAddr && emailSet.has(fromAddr)) {
        const lead = sentLeads.find((l) => l.email.toLowerCase() === fromAddr);
        if (lead) {
          await Lead.findByIdAndUpdate(lead._id, { status: 'Replied' });
          repliesFound++;
          console.log(`Auto-replied: ${fromAddr} → status set to Replied`);
        }
      }
    }

    if (repliesFound > 0) {
      console.log(`Reply check complete: ${repliesFound} lead(s) updated to Replied`);
    }

    await client.logout();
  } catch (err) {
    console.error('Reply check error:', err.message);
    try { await client.logout(); } catch {}
  }
};

// Start polling every 5 minutes
const startReplyPoller = () => {
  console.log('Reply poller started — checking inbox every 5 minutes');
  checkForReplies(); // run immediately on startup
  setInterval(checkForReplies, CHECK_INTERVAL_MS);
};

module.exports = { startReplyPoller };
