const GitHubStrategy = require('passport-github2').Strategy;
const mongoose = require('mongoose');
const User = require('../models/userModel'); // Correction du chemin du modèle

/**
 * Configuration de la stratégie GitHub pour Passport
 * Note: Cette stratégie est ici en backup mais n'est pas utilisée par défaut.
 * La configuration principale se trouve dans passport.js
 * @deprecated Utiliser la configuration dans passport.js à la place
 */
module.exports = function (passport) {
    console.log('⚠️ ATTENTION: Le module githubStrategy.js est chargé mais ne devrait pas être utilisé');
    console.log('⚠️ Utiliser la configuration dans passport.js à la place');
    
    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5001/auth/github/callback',
                scope: ['user:email']
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    console.log("GitHub Strategy (deprecated file): Profile Data:", profile);

                    const existingUser = await User.findOne({ githubId: profile.id });

                    if (existingUser) {
                        console.log("Existing user found:", existingUser._id);
                        return done(null, existingUser);
                    }

                    const firstName = profile.displayName ? profile.displayName.split(' ')[0] : 'Unknown';
                    const lastName = profile.displayName ? profile.displayName.split(' ')[1] || 'User' : 'User';

                    const newUser = new User({
                        githubId: profile.id,
                        firstName,
                        lastName,
                        email: profile.emails?.[0]?.value,
                        avatar: profile.photos?.[0]?.value || '',
                        isGithubUser: true,
                        userRole: 'STUDENT',
                        accountStatus: true,
                        isEmailVerified: true,
                        cin: 'GH' + Date.now().toString().slice(-7),
                        classe: '--',
                        departement: 'SE'
                    });

                    await newUser.save();
                    console.log("New user created:", newUser._id);
                    return done(null, newUser);
                } catch (error) {
                    console.error("Error in GitHub Strategy (deprecated file):", error);
                    return done(error, null);
                }
            }
        )
    );

    // Ces méthodes doivent être identiques à celles de passport.js
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
