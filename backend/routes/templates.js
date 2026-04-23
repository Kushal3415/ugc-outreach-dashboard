const router = require('express').Router();
const {
  getTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate,
} = require('../controllers/templateController');

router.get('/', getTemplates);
router.get('/:id', getTemplate);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

module.exports = router;
