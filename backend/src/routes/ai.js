const router = require('express').Router();
const { chat, summarize, voiceToTicket, bylawQuery, getAILogs } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

router.post('/chat', protect, chat);
router.post('/summarize', protect, authorize('admin'), summarize);
router.post('/voice-to-ticket', protect, voiceToTicket);
router.post('/bylaw', protect, bylawQuery);
router.get('/logs/:societyId', protect, authorize('admin'), getAILogs);

module.exports = router;
