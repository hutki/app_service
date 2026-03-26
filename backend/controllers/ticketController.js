const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Message = require('../models/Message');
const asyncHandler = require('express-async-handler');
const VALID_STATUSES = ['new', 'in progress', 'completed', 'rejected'];
const STATUS_EDIT_ROLES = ['admin', 'manager', 'engineer'];
const FULL_ACCESS_ROLES = ['admin', 'manager', 'engineer'];
const ASSIGNMENT_EDIT_ROLES = ['admin', 'manager'];
const FILE_DELETE_ROLES = ['admin'];

const canAccessTicket = (ticket, user) => {
  if (FULL_ACCESS_ROLES.includes(user.role)) {
    return true;
  }

  return ticket.createdBy?.toString() === user._id.toString();
};

const canDeleteTicketFile = (ticket, user) =>
  FILE_DELETE_ROLES.includes(user.role) || ticket.createdBy?.toString() === user._id.toString();

// Generate unique ticket number
const generateTicketNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `T${year}${month}${day}-${random}`;
};

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private
const getTickets = asyncHandler(async (req, res) => {
  const filters = FULL_ACCESS_ROLES.includes(req.user.role)
    ? {}
    : { createdBy: req.user._id };

  const tickets = await Ticket.find(filters).populate([
    { path: 'createdBy', select: 'username' },
    { path: 'assignedTo', select: 'username' }
  ]).sort({ createdAt: -1 });

  res.json(tickets);
});

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate([
    { path: 'createdBy', select: 'username' },
    { path: 'assignedTo', select: 'username' }
  ]);

  if (ticket) {
    if (!canAccessTicket(ticket, req.user)) {
      res.status(403);
      throw new Error('You do not have permission to view this ticket');
    }

    res.json(ticket);
  } else {
    res.status(404);
    throw new Error('Ticket not found');
  }
});

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = asyncHandler(async (req, res) => {
  const { description, assignedTo } = req.body;
  const normalizedDescription = typeof description === 'string' ? description.trim() : '';

  if (!normalizedDescription || normalizedDescription.length < 10) {
    res.status(400);
    throw new Error('Description must be at least 10 characters long');
  }

  const ticket = await Ticket.create({
    ticketNumber: generateTicketNumber(),
    description: normalizedDescription,
    createdBy: req.user._id,
    assignedTo
  });

  if (ticket) {
    // Populate the references
    const populatedTicket = await ticket.populate([
      { path: 'createdBy', select: 'username' },
      { path: 'assignedTo', select: 'username' }
    ]);
    res.status(201).json(populatedTicket);
  } else {
    res.status(400);
    throw new Error('Invalid ticket data');
  }
});

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (ticket) {
    if (!canAccessTicket(ticket, req.user)) {
      res.status(403);
      throw new Error('You do not have permission to update this ticket');
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
      const normalizedDescription = typeof req.body.description === 'string'
        ? req.body.description.trim()
        : '';

      if (!normalizedDescription || normalizedDescription.length < 10) {
        res.status(400);
        throw new Error('Description must be at least 10 characters long');
      }

      ticket.description = normalizedDescription;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'status')) {
      if (!STATUS_EDIT_ROLES.includes(req.user.role)) {
        res.status(403);
        throw new Error('You do not have permission to update ticket status');
      }

      if (!VALID_STATUSES.includes(req.body.status)) {
        res.status(400);
        throw new Error('Invalid ticket status');
      }

      ticket.status = req.body.status;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'assignedTo')) {
      if (!ASSIGNMENT_EDIT_ROLES.includes(req.user.role)) {
        res.status(403);
        throw new Error('You do not have permission to assign tickets');
      }

      if (!req.body.assignedTo) {
        ticket.assignedTo = undefined;
      } else {
        const assignee = await User.findById(req.body.assignedTo).select('_id role');

        if (!assignee) {
          res.status(400);
          throw new Error('Assigned user not found');
        }

        if (!['engineer', 'manager', 'admin'].includes(assignee.role)) {
          res.status(400);
          throw new Error('Assigned user must be a staff member');
        }

        ticket.assignedTo = assignee._id;
      }
    }

    const updatedTicket = await ticket.save();

    // Populate the references
    const populatedTicket = await updatedTicket.populate([
      { path: 'createdBy', select: 'username' },
      { path: 'assignedTo', select: 'username' }
    ]);
    res.json(populatedTicket);
  } else {
    res.status(404);
    throw new Error('Ticket not found');
  }
});

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private
const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (ticket) {
    if (!FULL_ACCESS_ROLES.includes(req.user.role)) {
      res.status(403);
      throw new Error('You do not have permission to delete this ticket');
    }

    await Message.deleteMany({ ticketId: ticket._id });
    await ticket.deleteOne();
    res.json({ message: 'Ticket removed' });
  } else {
    res.status(404);
    throw new Error('Ticket not found');
  }
});

// @desc    Add attachment to ticket
// @route   POST /api/tickets/:id/attachments
// @access  Private
const addAttachment = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (ticket) {
    if (!canAccessTicket(ticket, req.user)) {
      res.status(403);
      throw new Error('You do not have permission to update this ticket');
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

    ticket.attachments.push(attachment);
    await ticket.save();

    res.json(ticket);
  } else {
    res.status(404);
    throw new Error('Ticket not found');
  }
});

// @desc    Add acceptance photo to ticket
// @route   POST /api/tickets/:id/photos
// @access  Private
const addAcceptancePhoto = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (ticket) {
    if (!canAccessTicket(ticket, req.user)) {
      res.status(403);
      throw new Error('You do not have permission to update this ticket');
    }

    if (!req.file) {
      res.status(400);
      throw new Error('No photo file was uploaded');
    }

    const photo = {
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size
    };

    ticket.acceptancePhotos.push(photo);
    await ticket.save();

    res.json(ticket);
  } else {
    res.status(404);
    throw new Error('Ticket not found');
  }
});

// @desc    Remove attachment from ticket
// @route   DELETE /api/tickets/:id/attachments/:attachmentId
// @access  Private
const removeAttachment = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  if (!canDeleteTicketFile(ticket, req.user)) {
    res.status(403);
    throw new Error('You do not have permission to delete attachments from this ticket');
  }

  const attachment = ticket.attachments.id(req.params.attachmentId);

  if (!attachment) {
    res.status(404);
    throw new Error('Attachment not found');
  }

  attachment.deleteOne();
  await ticket.save();
  res.json(ticket);
});

// @desc    Remove acceptance photo from ticket
// @route   DELETE /api/tickets/:id/photos/:photoId
// @access  Private
const removeAcceptancePhoto = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  if (!canDeleteTicketFile(ticket, req.user)) {
    res.status(403);
    throw new Error('You do not have permission to delete photos from this ticket');
  }

  const photo = ticket.acceptancePhotos.id(req.params.photoId);

  if (!photo) {
    res.status(404);
    throw new Error('Photo not found');
  }

  photo.deleteOne();
  await ticket.save();
  res.json(ticket);
});

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  addAttachment,
  addAcceptancePhoto,
  removeAttachment,
  removeAcceptancePhoto
};
