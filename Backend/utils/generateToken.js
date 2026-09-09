const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_projectgo_2026';
  return jwt.sign({ id: userId }, secret, {
    expiresIn: '7d'
  });
};

module.exports = generateToken;
