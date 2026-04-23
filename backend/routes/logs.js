const router = require('express').Router();
const { getLogs, getEmailsPerDay, getEmailStats } = require('../controllers/logController');

router.get('/stats', getEmailStats);
router.get('/', getLogs);
router.get('/chart/per-day', getEmailsPerDay);

module.exports = router;
