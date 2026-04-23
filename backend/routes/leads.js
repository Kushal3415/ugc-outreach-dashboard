const router = require('express').Router();
const multer = require('multer');
const {
  getLeads, getLead, createLead, updateLead, deleteLead, uploadCsv, getStats,
} = require('../controllers/leadController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/stats', getStats);
router.get('/', getLeads);
router.get('/:id', getLead);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);
router.post('/upload/csv', upload.single('file'), uploadCsv);

module.exports = router;
