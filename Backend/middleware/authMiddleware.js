const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

const verifyJWT = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Unauthorized request: No token provided');
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedToken.id).select('-password');
    if (!user) {
      throw new ApiError(401, 'Unauthorized request: User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || 'Unauthorized request: Invalid token');
  }
});

module.exports = { verifyJWT };
