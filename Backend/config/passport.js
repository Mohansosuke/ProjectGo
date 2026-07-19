const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    passReqToCallback: true
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
        const parts = profile.displayName.trim().split(/\s+/);
        const initials = parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials || 'U')}&background=5f35f5&color=fff&bold=true`;

        user = await User.create({
          fullName: profile.displayName || 'Google User',
          email: email.toLowerCase(),
          photoURL: profile.photos && profile.photos[0] ? profile.photos[0].value : defaultAvatar,
          provider: 'google',
          isVerified: true,
          emailVerified: true
        });
        return done(null, user);
      }
    } catch (error) {
      return done(error, null);
    }
  }
));

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

module.exports = passport;
