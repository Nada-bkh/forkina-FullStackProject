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
const Verifyemail = require('../models/VerifyEmailToken');

const invalidatedTokens = new Set();

// Stockage en mémoire des tentatives de connexion échouées et des blocages temporaires
const failedLoginAttempts = {}; // { email: { count: number, lastAttempt: timestamp } }
const tempBlockedAccounts = {}; // { email: timestamp } timestamp = moment de déblocage

// Register function
const register = async (req, res) => {
  const { firstName, lastName, email, password, role, adminSecret, faceImage, faceDescriptor, cin } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });
    
    // Validation du CIN pour les étudiants
    if (role === "STUDENT" && !cin) {
      return res.status(400).json({ message: "CIN is required for student accounts" });
    }
    
    // Vérifier si le CIN existe déjà pour un autre étudiant
    if (cin) {
      const userWithCin = await User.findOne({ cin });
      if (userWithCin) return res.status(400).json({ message: "CIN already exists in the system" });
    }
    
    // Create user with face data if provided
    const user = new User({ 
      firstName, 
      lastName, 
      email, 
      password, 
      userRole: role || "STUDENT", 
      isVerified: false,
      faceImage: faceImage || null, // Add face image if provided
      faceDescriptor: faceDescriptor || null, // Add face descriptor if provided
      cin: cin || null, // Add CIN if provided
      classe: "--" // Par défaut, pas encore affecté
    });
    
    await user.save();
    const generatedToken = crypto.randomBytes(32).toString('hex');
    const newToken = new Verifyemail({ token: generatedToken, email, expiresAt: Date.now() + 3600000 });
    await newToken.save();
    const transporter = nodemailer.createTransport({ service: 'hotmail', auth: { user: 'Firdaous.JEBRI@esprit.tn', pass: 'xwbcgpyxnwghflrk' }, tls: { rejectUnauthorized: false }});
    await transporter.sendMail({ from: 'Firdaous.JEBRI@esprit.tn', to: email, subject: 'Email Verification', html: `<h1>Email Verification</h1><p>Please verify your email by clicking the link below:</p><a href="${BASE_URL}/verify-email/${generatedToken}">Verify Email</a>`});
    res.status(201).json({ message: "User registered successfully. Verification email sent.", user });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

// Email verification function
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const emailToken = await Verifyemail.findOne({ token });
    if (!emailToken || emailToken.expiresAt < Date.now()) return res.status(400).json({ message: "Invalid or expired token" });
    const user = await User.findOne({ email: emailToken.email });
    if (!user) return res.status(400).json({ message: "User not found" });
    user.isVerified = true;
    await user.save();
    await Verifyemail.deleteOne({ token });
    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

// Placeholder functions to fix missing exports
const login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    // Vérifier si le compte est temporairement bloqué
    if (tempBlockedAccounts[email] && tempBlockedAccounts[email] > Date.now()) {
      // Calculer le temps restant en minutes et secondes
      const remainingTime = Math.ceil((tempBlockedAccounts[email] - Date.now()) / 1000);
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      
      return res.status(429).json({ 
        message: `Votre compte est temporairement bloqué suite à plusieurs tentatives de connexion infructueuses. Réessayez dans ${minutes} minute${minutes !== 1 ? 's' : ''} et ${seconds} seconde${seconds !== 1 ? 's' : ''} ou réinitialisez votre mot de passe.`,
        blockedUntil: tempBlockedAccounts[email]
      });
    }
    
    // Recherche de l'utilisateur par email
    const user = await User.findOne({ email });
    if (!user) {
      // Incrémenter les tentatives échouées
      updateFailedAttempts(email);
      
      return res.status(401).json({ 
        message: "Invalid email or password",
        remainingAttempts: getRemainingAttempts(email)
      });
    }
    
    // Vérification du mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Incrémenter les tentatives échouées
      updateFailedAttempts(email);
      
      // Vérifier si le compte doit être bloqué
      if (shouldBlockAccount(email)) {
        blockAccount(email);
        return res.status(429).json({ 
          message: "Votre compte est temporairement bloqué suite à plusieurs tentatives de connexion infructueuses. Réessayez dans 2 minutes ou réinitialisez votre mot de passe.",
          blockedUntil: tempBlockedAccounts[email]
        });
      }
      
      return res.status(401).json({ 
        message: "Invalid email or password", 
        remainingAttempts: getRemainingAttempts(email)
      });
    }
    
    // Réinitialiser les tentatives échouées après un login réussi
    resetFailedAttempts(email);
    
    // Mise à jour des statistiques de connexion
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();
    
    // Génération du token JWT
    const token = user.generateToken();
    
    // Réponse avec données utilisateur et token
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.userRole
      },
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fonctions utilitaires pour la gestion des tentatives
function updateFailedAttempts(email) {
  if (!failedLoginAttempts[email]) {
    failedLoginAttempts[email] = { count: 1, lastAttempt: Date.now() };
  } else {
    failedLoginAttempts[email].count += 1;
    failedLoginAttempts[email].lastAttempt = Date.now();
  }
}

function getRemainingAttempts(email) {
  if (!failedLoginAttempts[email]) return 3;
  return Math.max(0, 3 - failedLoginAttempts[email].count);
}

function shouldBlockAccount(email) {
  return failedLoginAttempts[email] && failedLoginAttempts[email].count >= 3;
}

function blockAccount(email) {
  const blockDuration = 2 * 60 * 1000; // 2 minutes en millisecondes
  tempBlockedAccounts[email] = Date.now() + blockDuration;
}

function resetFailedAttempts(email) {
  delete failedLoginAttempts[email];
  delete tempBlockedAccounts[email];
}

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const { email, name, picture } = ticket.getPayload();
    
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name,
        avatar: picture,
        provider: 'google'
      });
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.cookie('token', jwtToken, { httpOnly: true });
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logout = async (req, res) => res.status(200).json({ message: "Logout function is missing" });
const forgotPassword = async (req, res) => res.status(200).json({ message: "Forgot password function is missing" });
const resetPassword = async (req, res) => res.status(200).json({ message: "Reset password function is missing" });
const checkTokenValidity = async (req, res, next) => next();

// Export all functions
module.exports = {
  register,
  verifyEmail,
  login,
  googleLogin,
  logout,
  forgotPassword,
  resetPassword,
  checkTokenValidity
};
