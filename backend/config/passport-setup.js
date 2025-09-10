import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import User from '../models/user.model.js';

// These MUST be in environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      proxy: true // Important for handling reverse proxies (like the one in this environment)
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists in our DB
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
          // Already have this user
          return done(null, existingUser);
        }

        // If not, create a new user in our DB
        const newUser = await new User({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
        }).save();

        done(null, newUser);
      } catch (err) {
        done(err, null);
      }
    }
  )
);
