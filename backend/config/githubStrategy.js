const GitHubStrategy = require('passport-github2').Strategy;
const mongoose = require('mongoose');
const User = require('../models/userModel'); // Adjusted path

module.exports = function (passport) {
    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL,
                scope: ['user:email', 'repo'],
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    console.log("GitHub Profile Data:", profile);

                    // Check if a user is already logged in (for linking)
                    let user = await User.findOne({ githubId: profile.id });

                    if (user) {
                        console.log("Existing user found:", user);
                        user.githubToken = accessToken;
                        await user.save();
                        return done(null, user);
                    }

                    // Check if a user exists with the same email to link the account
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

                    // If no user exists, create a new one
                    const firstName = profile.displayName ? profile.displayName.split(' ')[0] : 'Unknown';
                    const lastName = profile.displayName ? profile.displayName.split(' ')[1] || 'User' : 'User';
                    const tempCin = 'GH' + Date.now().toString().slice(-7);

                    const newUser = new User({
                        githubId: profile.id,
                        githubUsername: profile.username,
                        githubToken: accessToken,
                        firstName,
                        lastName,
                        email: profile.emails?.[0]?.value || `${profile.username}@github.com`,
                        avatar: profile.photos?.[0]?.value || '',
                        isGithubUser: true,
                        userRole: 'STUDENT',
                        accountStatus: true,
                        isEmailVerified: true,
                        cin: tempCin,
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