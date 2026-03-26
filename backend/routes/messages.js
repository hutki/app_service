const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getMessages,
  sendMessage,
  addAttachment,
  deleteMessage
} = require('../controllers/messageController');

// All routes are protected
router.route('/:ticketId')
  .get(protect, getMessages);

router.route('/')
  .post(protect, sendMessage);

router.route('/item/:id')
  .delete(protect, deleteMessage);

// File upload route
router.route('/:id/attachments')
  .post(protect, upload.single('attachment'), addAttachment);

module.exports = router;
