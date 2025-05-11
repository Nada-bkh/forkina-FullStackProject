const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const passport = require("passport");
const User = require("../models/userModel");

const BACKEND_URL = "http://localhost:5001";
const CLIENT_URL = "http://localhost:5173";

const GOOGLE_CONFIG = {
  clientID: "307626813879-okfk3jlk3b3ivq9gcih2qe1je8enr5l4.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: `${BACKEND_URL}/auth/google/callback`,
  scope: ["profile", "email"]
};

const GITHUB_CONFIG = {
  clientID: "Ov23liBZzVg4orCNxtPI",
  clientSecret: "ece54871ec2c159b1466b9ddcdbe91562c7c5f3a",
  callbackURL: `${BACKEND_URL}/auth/github/callback`,
  scope: ["user:email"],
  authorizationURL: "https://github.com/login/oauth/authorize",
  passReqToCallback: true,
  state: true
};

// Debug environment variables
console.log('Passport Config:', {
  GOOGLE_CLIENT_ID: GOOGLE_CONFIG.clientID,
  GITHUB_CLIENT_ID: GITHUB_CONFIG.clientID,
  callbackURL: GOOGLE_CONFIG.callbackURL,
  githubCallbackURL: GITHUB_CONFIG.callbackURL,
  CLIENT_URL: CLIENT_URL
});

// Check for required environment variables
if (!GOOGLE_CONFIG.clientID || !GOOGLE_CONFIG.clientSecret) {
  console.error('Missing required Google OAuth credentials in environment variables');
  process.exit(1);
}

// Google Strategy
passport.use(
    new GoogleStrategy(GOOGLE_CONFIG, async function (accessToken, refreshToken, profile, done) {
      try {
        console.log('Google Profile:', {
          id: profile.id,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName
        });

        // Check if user exists by email
        let user = await User.findOne({ email: profile.emails[0].value });
        console.log('Existing user:', user);

        if (user) {
          // If user exists but does not have Google ID, update it
          if (!user.googleId) {
            user.googleId = profile.id;
            user.isGoogleUser = true;
            await user.save();
          }
          return done(null, user);
        }

        // Generate a temporary CIN for Google users
        const tempCin = 'G' + Date.now().toString().slice(-7);

        // If no user exists, create a new one with STUDENT role
        const userData = {
          googleId: profile.id,
          firstName: profile.name?.givenName || profile.displayName.split(' ')[0],
          lastName: profile.name?.familyName || profile.displayName.split(' ')[1] || '',
          email: profile.emails[0].value,
          avatar: profile.photos?.[0]?.value,
          isGoogleUser: true,
          userRole: 'STUDENT',
          accountStatus: true,
          isEmailVerified: true,
          cin: tempCin, // Add temporary CIN
        };

        console.log('Creating new user with data:', userData);
        user = await User.create(userData);
        console.log('New user created:', user);

        return done(null, user);
      } catch (error) {
        console.error('Error in Google Strategy:', error);
        return done(error, null);
      }
    })
);


// GitHub Strategy
// Update the GitHub Strategy in Passport.js
passport.use(
    new GitHubStrategy(GITHUB_CONFIG, async function(request, accessToken, refreshToken, profile, done) {
      try {
        if (!profile) {
          return done(new Error("No profile received from GitHub"), null);
        }

        console.log('GitHub Profile:', {
          id: profile.id,
          displayName: profile.displayName,
          username: profile.username,
          email: profile.emails?.[0]?.value,
          avatar: profile.photos?.[0]?.value
        });

        let user = await User.findOne({ githubId: profile.id });

        if (user) {
          user.githubToken = accessToken;
          await user.save();
          console.log('Existing user updated with token:', user);
          return done(null, user);
        }

        user = await User.findOne({ email: profile.emails?.[0]?.value });
        if (user) {
          user.githubId = profile.id;
          user.githubUsername = profile.username;
          user.githubToken = accessToken;
          user.isGithubUser = true;
          await user.save();
          console.log("Linked GitHub account to existing user:", user);
          return done(null, user);
        }

        const firstName = profile.displayName ? profile.displayName.split(' ')[0] : profile.username;
        const lastName = profile.displayName ? profile.displayName.split(' ').slice(1).join(' ') : 'User';
        const tempCin = 'GH' + Date.now().toString().slice(-7);

        const userData = {
          githubId: profile.id,
          githubUsername: profile.username,
          githubToken: accessToken,
          firstName: firstName,
          lastName: lastName || 'User',
          email: profile.emails?.[0]?.value || `${profile.username}@github.com`,
          avatar: profile.photos?.[0]?.value,
          isGithubUser: true,
          userRole: 'STUDENT',
          accountStatus: true,
          isEmailVerified: true,
          cin: tempCin,
        };
        console.log('Creating new user with data:', userData);

        user = await User.create(userData);
        console.log('New user created:', user);
        return done(null, user);
      } catch (error) {
        console.error('Error in GitHub Strategy:', error);
        return done(error, null);
      }
    })
);

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id);
  done(null, user._id.toString()); // Use _id and convert to string
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log('Deserializing user:', id);
    const user = await User.findById(id);
    console.log('Deserialized user found:', user ? 'yes' : 'no');
    if (!user) {
      return done(null, false); // Handle case where user is not found
    }
    done(null, user);
  } catch (error) {
    console.error('Deserialize error:', error);
    done(error, null);
  }
});
module.exports = passport;