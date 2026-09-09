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


// In-memory set to guard against duplicate callback redemption causing invalid_grant
const processedCodes = new Set();

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    callbackURL: passport.googleCallbackURL || 'https://projectgo-backend.onrender.com/api/auth/google/callback'
  })
);

router.get('/google/callback', (req, res, next) => {
  const code = req.query && typeof req.query.code === 'string' ? req.query.code : null;

  // Safe temporary diagnostic logging: Log when callback route starts (NO codes, secrets, tokens, passwords)
  console.log('[Google OAuth Callback Started]', {
    NODE_ENV: process.env.NODE_ENV || 'undefined',
    configuredCallbackURL: passport.googleCallbackURL || 'https://projectgo-backend.onrender.com/api/auth/google/callback',
    hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
    hasGoogleClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    hasCodeParam: Boolean(code),
    isDuplicateAttempt: code ? processedCodes.has(code) : false,
    timestamp: new Date().toISOString()
  });

  // Guard against duplicate callback executions (e.g. browser double-fetch, extension prefetch, or page refresh)
  if (code && processedCodes.has(code)) {
    console.warn('[Google OAuth Callback] Duplicate code exchange detected. Preventing re-exchange to avoid invalid_grant.');
    const clientUrl = process.env.CLIENT_URL || 'https://project-go-lilac.vercel.app';
    if (!res.headersSent) {
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Login session already processed. Please sign in again.')}`);
    }
    return;
  }

  if (code) {
    processedCodes.add(code);
    // Keep in set for 60 seconds to prevent double exchange, then clean up memory
    setTimeout(() => {
      processedCodes.delete(code);
    }, 60000);
  }

  try {
    passport.authenticate('google', {
      session: false,
      callbackURL: passport.googleCallbackURL || 'https://projectgo-backend.onrender.com/api/auth/google/callback'
    }, (err, user, info) => {
      try {
        const clientUrl = process.env.CLIENT_URL || 'https://project-go-lilac.vercel.app';

        if (err) {
          // Safe temporary diagnostic logging: Log when Passport authentication fails
          console.error('[Google OAuth Callback Failed]:', {
            name: err.name,
            message: err.message,
            code: err.code
          });

          if (!res.headersSent) {
            return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(err.message || 'Google authentication failed')}`);
          }
          return;
        }

        if (!user) {
          // Safe temporary diagnostic logging: Log failure when no user returned
          console.error('[Google OAuth Callback Failed - No User Returned]:', info?.message || info || 'No user returned');

          if (!res.headersSent) {
            return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(info?.message || 'Google authentication failed')}`);
          }
          return;
        }

        // Safe temporary diagnostic logging: Log when Passport authentication succeeds
        console.log('[Google OAuth Callback Succeeded]', {
          userId: user._id ? String(user._id) : undefined
        });

        req.user = user;
        return googleCallback(req, res, next);
      } catch (callbackHandlerError) {
        console.error('[Google OAuth Controlled Error Handler Caught Exception]:', callbackHandlerError);
        const clientUrl = process.env.CLIENT_URL || 'https://project-go-lilac.vercel.app';
        if (!res.headersSent) {
          return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Authentication processing error')}`);
        }
      }
    })(req, res, next);
  } catch (passportInvokeError) {
    console.error('[Google OAuth Passport Invoke Exception]:', passportInvokeError);
    const clientUrl = process.env.CLIENT_URL || 'https://project-go-lilac.vercel.app';
    if (!res.headersSent) {
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('OAuth initialization error')}`);
    }
  }
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
