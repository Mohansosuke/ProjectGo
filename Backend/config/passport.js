require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const clientID = process.env.GOOGLE_CLIENT_ID
  ? process.env.GOOGLE_CLIENT_ID.trim().replace(/^["']|["']$/g, '')
  : undefined;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  ? process.env.GOOGLE_CLIENT_SECRET.trim().replace(/^["']|["']$/g, '')
  : undefined;

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);

// Resolve callback URL defensively so production never accidentally inherits a localhost URL from .env
const resolveCallbackURL = () => {
  const envUrl = process.env.GOOGLE_CALLBACK_URL
    ? process.env.GOOGLE_CALLBACK_URL.trim().replace(/\/+$/, '')
    : '';

  if (isProduction) {
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return 'https://projectgo-backend.onrender.com/api/auth/google/callback';
    }
    return envUrl;
  }

  return envUrl || 'http://localhost:5000/api/auth/google/callback';
};

const callbackURL = resolveCallbackURL();

// Safe temporary diagnostic logging (DO NOT log client secret, tokens, JWT, passwords)
console.log('[Google OAuth Strategy Init]', {
  NODE_ENV: process.env.NODE_ENV || 'undefined',
  isRender: Boolean(process.env.RENDER),
  configuredCallbackURL: callbackURL,
  hasGoogleClientId: Boolean(clientID),
  hasGoogleClientSecret: Boolean(clientSecret)
});

passport.use(
  new GoogleStrategy(
    {
      clientID,
      clientSecret,
      callbackURL,
      proxy: true,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email) {
          return done(new Error('No email found in your Google profile'), null);
        }

        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
          user.lastLogin = new Date();
          if (!user.provider || user.provider === 'local') {
            user.provider = 'google';
          }
          user.isVerified = true;
          user.emailVerified = true;
          await user.save();
          return done(null, user);
        } else {
          const parts = (profile.displayName || '').trim().split(/\s+/);
          const initials = parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
          const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials || 'U')}&background=5f35f5&color=fff&bold=true`;

          user = await User.create({
            fullName: profile.displayName || 'Google User',
            email: email.toLowerCase(),
            photoURL: profile.photos && profile.photos[0] ? profile.photos[0].value : defaultAvatar,
            provider: 'google',
            isVerified: true,
            emailVerified: true,
            lastLogin: new Date()
          });
          return done(null, user);
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.googleCallbackURL = callbackURL;
module.exports = passport;