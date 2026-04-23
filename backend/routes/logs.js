const router = require('express').Router();
const { getLogs, getEmailsPerDay } = require('../controllers/logController');

router.get('/', getLogs);
router.get('/chart/per-day', getEmailsPerDay);

module.exports = router;
