const express = require('express');
const router = express.Router();
const passport = require('passport');
require('../config/passport');

const {
  signup,
  verifyEmail,
  login,
  logout,
  heartbeat,
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


router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    const clientUrl = process.env.CLIENT_URL || 'https://project-go-lilac.vercel.app';
    if (err) {
      console.error('Google OAuth Authentication Error:', err);
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(err.message || 'Google authentication failed')}`);
    }
    if (!user) {
      console.error('Google OAuth No User Returned:', info);
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(info?.message || 'Google authentication failed')}`);
    }
    req.user = user;
    return googleCallback(req, res, next);
  })(req, res, next);
});

router.post('/signup', signupValidator, validate, signup);
router.get('/verify/:token', verifyEmail);
router.post('/login', loginValidator, validate, login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, resetPassword);

router.get('/me', verifyJWT, getMe);
router.patch('/heartbeat', verifyJWT, heartbeat);
router.put('/profile', verifyJWT, updateProfile);
router.get('/users', verifyJWT, getAllUsers);
router.delete('/delete-account', verifyJWT, deleteAccount);

module.exports = router;
