const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  addAttachment,
  addAcceptancePhoto,
  removeAttachment,
  removeAcceptancePhoto
} = require('../controllers/ticketController');

// All routes are protected
router.route('/')
  .get(protect, getTickets)
  .post(protect, createTicket);

router.route('/:id')
  .get(protect, getTicketById)
  .put(protect, updateTicket)
  .delete(protect, deleteTicket);

// File upload routes
router.route('/:id/attachments')
  .post(protect, upload.single('attachment'), addAttachment);

router.route('/:id/attachments/:attachmentId')
  .delete(protect, removeAttachment);

router.route('/:id/photos')
  .post(protect, upload.single('photo'), addAcceptancePhoto);

router.route('/:id/photos/:photoId')
  .delete(protect, removeAcceptancePhoto);

module.exports = router;
