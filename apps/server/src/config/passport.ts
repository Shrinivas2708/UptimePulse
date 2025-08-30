import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User';
import logger from '../utils/logger';
import Integration from '../models/Integration';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          logger.error('Google profile does not contain an email address.');
          return done(new Error('No email found in Google profile'), undefined);
        }

        let user = await User.findOne({ email });

        if (user) {
          logger.info(`User already exists, linking Google ID for email: ${email}`);
          user.googleId = profile.id;
          await user.save();
        } else {
          logger.info(`Creating new user with Google account for email: ${email}`);
          user = new User({
            email,
            passwordHash: '',
            googleId: profile.id,
            emailVerified: true,
          });
          await user.save();
          const defaultEmailIntegration = new Integration({
            userId: user._id,
            type: 'email',
            name: 'Primary Email', // Use a distinct name
            details: {
              email: user.email,
            },
          });
          await defaultEmailIntegration.save();
          logger.info(`Created default email integration for user: ${email}`);
        }

        return done(null, user);
      } catch (err: any) {
        logger.error('Google OAuth authentication failed:', err.message);
        return done(err, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      // User not found in DB, return false to indicate failure
      return done(null, false);
    }
    // User found, return user object
    done(null, user);
  } catch (err: any) {
    // An error occurred during the database query
    done(err, undefined);
  }
});

export default passport;