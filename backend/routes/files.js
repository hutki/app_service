const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { downloadFile } = require('../controllers/fileController');

// All routes are protected
router.route('/:filename')
  .get(protect, downloadFile);

module.exports = router;