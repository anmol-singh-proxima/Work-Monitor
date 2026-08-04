const express = require('express');
const worklogController = require('../controllers/worklogController');

const router = express.Router();

router.get('/:date', worklogController.getDailyWorklog);
router.post('/:date', worklogController.createSession);
router.put('/:date/:id', worklogController.updateSession);
router.delete('/:date/:id', worklogController.deleteSession);

module.exports = router;
