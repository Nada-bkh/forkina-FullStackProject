const GitHubStrategy = require('passport-github2').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust the path to your User model

module.exports = function (passport) {
    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL,
                scope: ['user:email']
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    console.log("GitHub Profile Data:", profile);

                    const existingUser = await User.findOne({ githubId: profile.id });

                    if (existingUser) {
                        console.log("Existing user found:", existingUser);
                        return done(null, existingUser);
                    }

                    const firstName = profile.displayName ? profile.displayName.split(' ')[0] : 'Unknown';
                    const lastName = profile.displayName ? profile.displayName.split(' ')[1] || 'User' : 'User';

                    const newUser = new User({
                        githubId: profile.id,
                        firstName,
                        lastName,
                        email: profile.emails?.[0]?.value || 'no-email@github.com',
                        avatar: profile.photos?.[0]?.value || '',
                        isGithubUser: true
                    });

                    await newUser.save();
                    console.log("New user created:", newUser);
                    return done(null, newUser);
                } catch (error) {
                    console.error("Error in GitHub Strategy:", error);
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
};
