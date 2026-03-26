const Message = require('../models/Message');
const Ticket = require('../models/Ticket');
const asyncHandler = require('express-async-handler');
const FULL_ACCESS_ROLES = ['admin', 'manager', 'engineer'];

const getAccessibleTicket = async (ticketId, user) => {
  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    return null;
  }

  if (FULL_ACCESS_ROLES.includes(user.role) || ticket.createdBy.toString() === user._id.toString()) {
    return ticket;
  }

  return false;
};

// @desc    Get messages for a ticket
// @route   GET /api/messages/:ticketId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const accessibleTicket = await getAccessibleTicket(req.params.ticketId, req.user);

  if (accessibleTicket === null) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  if (accessibleTicket === false) {
    res.status(403);
    throw new Error('You do not have permission to view messages for this ticket');
  }

  const messages = await Message.find({ ticketId: req.params.ticketId })
    .populate('senderId', 'username')
    .sort({ timestamp: 1 });

  res.json(messages);
});

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { ticketId, content } = req.body;
  const normalizedContent = typeof content === 'string' ? content.trim() : '';
  const accessibleTicket = await getAccessibleTicket(ticketId, req.user);

  if (accessibleTicket === null) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  if (accessibleTicket === false) {
    res.status(403);
    throw new Error('You do not have permission to send messages for this ticket');
  }

  if (!normalizedContent) {
    res.status(400);
    throw new Error('Message content is required');
  }

  const message = await Message.create({
    ticketId,
    senderId: req.user._id,
    content: normalizedContent
  });

  if (message) {
    // Populate the sender reference
    const populatedMessage = await message.populate('senderId', 'username');
    res.status(201).json(populatedMessage);
  } else {
    res.status(400);
    throw new Error('Invalid message data');
  }
});

// @desc    Add attachment to message
// @route   POST /api/messages/:id/attachments
// @access  Private
const addAttachment = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (message) {
    if (message.senderId.toString() !== req.user._id.toString() && !FULL_ACCESS_ROLES.includes(req.user.role)) {
      res.status(403);
      throw new Error('You do not have permission to update this message');
    }

    if (!req.file) {
      res.status(400);
      throw new Error('No attachment file was uploaded');
    }

    const attachment = {
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size
    };

    message.attachments.push(attachment);
    await message.save();

    res.json(message);
  } else {
    res.status(404);
    throw new Error('Message not found');
  }
});

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  if (message.senderId.toString() !== req.user._id.toString() && !FULL_ACCESS_ROLES.includes(req.user.role)) {
    res.status(403);
    throw new Error('You do not have permission to delete this message');
  }

  await message.deleteOne();
  res.json({ message: 'Message removed' });
});

module.exports = {
  getMessages,
  sendMessage,
  addAttachment,
  deleteMessage
};
