const path = require('path');
const fs = require('fs').promises;
const asyncHandler = require('express-async-handler');

// @desc    Download a file
// @route   GET /api/files/:filename
// @access  Private
const downloadFile = asyncHandler(async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);

  try {
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch (error) {
    res.status(404);
    throw new Error('File not found');
  }
});

module.exports = {
  downloadFile
};