const router = require('express').Router();
const { bulkSend, followUpSend, getFollowUpCandidates } = require('../controllers/emailController');

router.post('/send-bulk', bulkSend);
router.post('/send-followup', followUpSend);
router.get('/followup-candidates', getFollowUpCandidates);

module.exports = router;
