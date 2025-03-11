const router = require("express").Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");

const CLIENT_URL = "http://localhost:5173";
const FAILURE_URL = "http://localhost:5173/signin";

// Initial Google authentication
router.get("/google", 
  passport.authenticate("google", { 
    scope: ["profile", "email"],
    prompt: "select_account"
  })
);

// Initial GitHub authentication
router.get("/github",
  passport.authenticate("github", { 
    scope: ["user:email"],
    allow_signup: true
  })
);

// Google auth callback
router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: true }, async (err, user, info) => {
      if (err) {
        console.error('Authentication error:', err);
        return res.redirect(FAILURE_URL);
      }

      if (!user) {
        console.error('No user found/created');
        return res.redirect(FAILURE_URL);
      }

      try {
        // Generate token with consistent field names
        const token = jwt.sign(
          { 
            id: user._id.toString(),
            email: user.email,
            role: user.userRole || 'STUDENT' // Ensure role is set, default to STUDENT
          },
          process.env.JWT_SECRET || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsInJvbGUiOiJTVFVERU5UIiwiaWF0IjoxNzQwMTM1NjEyLCJleHAiOjE3NDA3NDA0MTJ9.zUhKAi8PO7X8IAfPcbGw2j2LhdtuLBW6ww2E0VuthXU",
          { expiresIn: '7d' }
        );

        // Log token and user data for debugging
        console.log('Generated token:', token);
        console.log('User data:', {
          id: user._id,
          email: user.email,
          role: user.userRole,
          isGoogleUser: user.isGoogleUser
        });

        // Redirect with token and role
        res.redirect(`${CLIENT_URL}/auth-transfer?token=${token}&role=${user.userRole || 'STUDENT'}`);
      } catch (error) {
        console.error('Token/login error:', error);
        return res.redirect(FAILURE_URL);
      }
    })(req, res, next);
  }
);

// GitHub auth callback
router.get(
  "/github/callback",
  (req, res, next) => {
    passport.authenticate("github", { session: true }, async (err, user, info) => {
      if (err) {
        console.error('GitHub Authentication error:', err);
        return res.redirect(FAILURE_URL);
      }

      if (!user) {
        console.error('No GitHub user found/created');
        return res.redirect(FAILURE_URL);
      }

      try {
        // Generate token with consistent field names
        const token = jwt.sign(
          { 
            id: user._id.toString(),
            email: user.email,
            role: user.userRole 
          },
          process.env.JWT_SECRET || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsInJvbGUiOiJTVFVERU5UIiwiaWF0IjoxNzQwMTM1NjEyLCJleHAiOjE3NDA3NDA0MTJ9.zUhKAi8PO7X8IAfPcbGw2j2LhdtuLBW6ww2E0VuthXU",
          { expiresIn: '7d' }
        );

        // Set token in cookie
        res.cookie('auth_token', token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/' // Ensure the cookie is available on all paths
        });

        // Log the user in
        req.login(user, (err) => {
          if (err) {
            console.error('Login error:', err);
            return res.redirect(FAILURE_URL);
          }
          res.redirect(`${CLIENT_URL}/auth-transfer`);
        });
      } catch (error) {
        console.error('Token/login error:', error);
        return res.redirect(FAILURE_URL);
      }
    })(req, res, next);
  }
);

// Check authentication status
router.get("/login/success", (req, res) => {
  if (req.user) {
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: req.user,
    });
  } else {
    res.status(403).json({ success: false, message: "Not authorized" });
  }
});

router.get("/login/failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "Login failed",
  });
});

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.clearCookie('token');
    res.redirect(CLIENT_URL);
  });
});

module.exports = router; 