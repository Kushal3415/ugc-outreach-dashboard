const router = require('express').Router();
const EmailLog = require('../models/EmailLog');

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

// GET /api/track/:logId — called when recipient opens the email
router.get('/:logId', async (req, res) => {
  try {
    await EmailLog.findByIdAndUpdate(req.params.logId, {
      opened: true,
      openedAt: new Date(),
    });
  } catch {
    // Silently ignore — always return the pixel
  }

  res.set({
    'Content-Type': 'image/gif',
    'Content-Length': PIXEL.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });
  res.end(PIXEL);
});

module.exports = router;
