const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');
const BASE_URL = process.env.NODE_ENV === 'production' ? 'https://mon-app.com' : 'http://localhost:5173';
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const PasswordResetToken = require('../models/PasswordResetToken');

const invalidatedTokens = new Set();

// Register function
exports.register = async (req, res) => {
  const { firstName, lastName, email, password, role, adminSecret } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // If role is ADMIN, check extra conditions:
    if (role === "ADMIN") {
      // Option 1: Prevent multiple admins by checking if one already exists
      const adminExists = await User.findOne({ userRole: "ADMIN" });
      if (adminExists) {
        return res.status(400).json({ message: "Admin already exists" });
      }

      // Option 2 (optional): Require a valid admin secret to register as an admin
      if (adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ message: "Not authorized to register as admin" });
      }
    }

    // Create the new user. The password will be hashed via the pre-save middleware in the model.
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      userRole: role || "STUDENT"
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Login function
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create JWT token with consistent field names
    const token = jwt.sign(
      { 
        id: user._id.toString(), // Convert ObjectId to string
        email: user.email,
        role: user.userRole 
      },
      process.env.JWT_SECRET || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsInJvbGUiOiJTVFVERU5UIiwiaWF0IjoxNzQwMTM1NjEyLCJleHAiOjE3NDA3NDA0MTJ9.zUhKAi8PO7X8IAfPcbGw2j2LhdtuLBW6ww2E0VuthXU",
      { expiresIn: '7d' }
    );

    // Create session
    req.session.userId = user._id;
    req.session.userRole = user.userRole;

    // Send response with user info
    res.json({ 
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.userRole,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Logout function
exports.logout = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      // Add token to invalidated set
      invalidatedTokens.add(token);
    }

    // Clear session
    if (req.session) {
      req.session.destroy();
    }

    // Clear cookies with proper options
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict'
    });

    res.clearCookie('connect.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict'
    });

    res.status(200).json({ message: "Déconnexion réussie" });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: "Erreur lors de la déconnexion" });
  }
};

// Check token validity
exports.checkTokenValidity = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // No token provided
    if (!token) {
      return res.status(401).json({ message: "Authentification requise" });
    }

    // Check if token is invalidated
    if (invalidatedTokens.has(token)) {
      return res.status(401).json({ message: "Session expirée" });
    }

    // Check session
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Session invalide" });
    }

    next();
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(401).json({ message: "Erreur d'authentification" });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const generatedToken = crypto.randomBytes(32).toString('hex');
    const newToken = new PasswordResetToken({
      token: generatedToken,
      email: email,
      expiresAt: Date.now() + 3600000
    });

    await newToken.save();

    const transporter = nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: 'Firdaous.JEBRI@esprit.tn',
        pass: 'xwbcgpyxnwghflrk'
      },
      tls: { rejectUnauthorized: false }
    });

    const mailOptions = {
      from: 'Firdaous.JEBRI@esprit.tn',
      to: email,
      subject: 'Password Reset Request',
      html: `<h1>Réinitialisation de votre mot de passe</h1><p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur ce lien pour réinitialiser votre mot de passe :</p><a href="${BASE_URL}/reset-password/${generatedToken}">Réinitialiser le mot de passe</a><p>Si vous n'avez pas fait cette demande, ignorez cet e-mail.</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error occurred:', error);
        return res.status(500).json({ message: 'Error sending the password reset email', error: error.message });
      } else {
        res.status(200).json({ message: 'Password reset link sent.' });
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing the password reset request', error: error.message });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Vérifier si le token de réinitialisation est valide et non expiré
    const passwordResetToken = await PasswordResetToken.findOne({ token });
    if (!passwordResetToken) return res.status(400).json({ message: "Token invalide ou expiré" });
    if (passwordResetToken.expiresAt < Date.now()) return res.status(400).json({ message: "Le token a expiré" });

    // Trouver l'utilisateur correspondant au token de réinitialisation
    const user = await User.findOne({ email: passwordResetToken.email });
    if (!user) return res.status(400).json({ message: "Utilisateur introuvable" });

    // 🔹 Hachage du nouveau mot de passe avec la méthode du modèle (via le middleware `pre-save`)
    user.password = newPassword;

    // Sauvegarder l'utilisateur avec le mot de passe haché
    await user.save();

    // Supprimer le token de réinitialisation après utilisation
    await PasswordResetToken.deleteOne({ token });

    res.status(200).json({ message: "Le mot de passe a été réinitialisé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la réinitialisation du mot de passe", error: error.message });
  }
};

// Google login
exports.googleLogin = async (req, res) => {
  try {
    const { email, firstName, lastName, picture, accessToken } = req.body;

    if (!email || !accessToken) {
      return res.status(400).json({ message: 'Email and access token are required' });
    }

    // Verify Google token
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    try {
      const ticket = await client.verifyIdToken({
        idToken: accessToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      
      if (payload.email !== email) {
        return res.status(401).json({ message: 'Email verification failed' });
      }
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        email,
        firstName,
        lastName,
        userRole: 'STUDENT',
        accountStatus: true,
        isGoogleUser: true,
        profilePicture: picture,
        password: crypto.randomBytes(20).toString('hex')
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.userRole,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
};

// Export all functions
module.exports = {
  register: exports.register,
  login: exports.login,
  logout: exports.logout,
  checkTokenValidity: exports.checkTokenValidity,
  forgotPassword: exports.forgotPassword,
  resetPassword: exports.resetPassword,
  googleLogin: exports.googleLogin
};
