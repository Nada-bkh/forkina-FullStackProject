const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const User = require('../models/userModel');

// GitHub OAuth configuration
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:5173/auth/github/callback"
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      // Check if the user already exists in the database
      let user = await User.findOne({ githubId: profile.id });

      if (!user) {
        user = new User({
          firstName: profile.displayName?.split(' ')[0] || '',
          lastName: profile.displayName?.split(' ')[1] || '',
          email: profile._json.email || `${profile.username}@github.com`, // Fallback email
          githubId: profile.id, // Store GitHub ID
          password: '',
          userRole: 'STUDENT',
        });
        await user.save();
      }
      

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Serialize and deserialize user
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});