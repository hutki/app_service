const User = require('../models/User');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const USER_LIST_ROLES = ['admin', 'manager', 'engineer'];

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  // Check if user exists
  const userExists = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    role: role || 'client'
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await user.comparePassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get users list
// @route   GET /api/auth/users
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
  if (!USER_LIST_ROLES.includes(req.user.role)) {
    res.status(403);
    throw new Error('You do not have permission to view users');
  }

  const roleFilter = req.query.roles
    ? { role: { $in: req.query.roles.split(',').map((role) => role.trim()).filter(Boolean) } }
    : {};

  const users = await User.find(roleFilter)
    .select('_id username email role')
    .sort({ username: 1 });

  res.json(users);
});

module.exports = {
  registerUser,
  loginUser,
  getUsers
};
