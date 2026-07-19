const express = require('express');
const router = express.Router();
const passport = require('passport');
require('../config/passport');

const {
  signup,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  googleCallback,
  deleteAccount
} = require('../controllers/authController');
const { updateProfile, getAllUsers } = require('../controllers/userController');
const { verifyJWT } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { signupValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator } = require('../validators/authValidator');

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=Google auth failed` }),
  googleCallback
);

router.post('/signup', signupValidator, validate, signup);
router.get('/verify/:token', verifyEmail);
router.post('/login', loginValidator, validate, login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, resetPassword);

router.get('/me', verifyJWT, getMe);
router.put('/profile', verifyJWT, updateProfile);
router.get('/users', verifyJWT, getAllUsers);
router.delete('/delete-account', verifyJWT, deleteAccount);

module.exports = router;
