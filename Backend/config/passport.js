const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

const callbackURL =
  process.env.GOOGLE_CALLBACK_URL ||
  (process.env.NODE_ENV === 'production' || process.env.RENDER
    ? 'https://projectgo-backend.onrender.com/api/auth/google/callback'
    : 'http://localhost:5000/api/auth/google/callback'
  );

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
      // Keep your existing Google authentication logic here
    }
  )
);

module.exports = passport;