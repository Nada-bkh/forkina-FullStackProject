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
  const { firstName, lastName, email, password, role, adminSecret, faceImage, faceImagePath, faceDescriptor, cin, departement } = req.body;
  try {
    console.log('Inscription - données reçues:', { 
      firstName, lastName, email, role, 
      hasFaceImage: !!faceImagePath || !!faceImage,
      hasFaceDescriptor: !!faceDescriptor,
      cin, departement 
    });
    
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
    const userData = { 
      firstName, 
      lastName, 
      email, 
      password, 
      userRole: role || "STUDENT", 
      isVerified: false,
      faceImage: faceImagePath || faceImage || null, // Support both naming conventions
      faceDescriptor: faceDescriptor || null, // Add face descriptor if provided
      cin: cin || null, // Add CIN if provided
      classe: "--", // Par défaut, pas encore affecté
      departement: departement || 'SE' // Utiliser la valeur fournie ou une valeur par défaut
    };
    
    // Position académique pour les tuteurs
    if (role === "TUTOR" && !userData.academicPosition) {
      userData.academicPosition = "ASSISTANT"; // Valeur par défaut
    }
    
    const user = new User(userData);
    
    try {
      await user.save();
      console.log('Utilisateur créé avec succès:', {
        id: user._id,
        email: user.email,
        role: user.userRole
      });
    } catch (saveError) {
      console.error('Erreur lors de la sauvegarde de l\'utilisateur:', saveError);
      return res.status(400).json({ 
        message: "User validation failed", 
        error: saveError.message 
      });
    }
    
    // Ignorer la vérification par email pendant les tests
    try {
      const generatedToken = crypto.randomBytes(32).toString('hex');
      const newToken = new Verifyemail({ token: generatedToken, email, expiresAt: Date.now() + 3600000 });
      await newToken.save();
      
      // Essayer d'envoyer l'email, mais continuer même si ça échoue
      try {
        const transporter = nodemailer.createTransport({ 
          service: 'hotmail', 
          auth: { user: 'Firdaous.JEBRI@esprit.tn', pass: 'xwbcgpyxnwghflrk' }, 
          tls: { rejectUnauthorized: false }
        });
        await transporter.sendMail({ 
          from: 'Firdaous.JEBRI@esprit.tn', 
          to: email, 
          subject: 'Email Verification', 
          html: `<h1>Email Verification</h1><p>Please verify your email by clicking the link below:</p><a href="${BASE_URL}/verify-email/${generatedToken}">Verify Email</a>`
        });
        console.log('Email de vérification envoyé à:', email);
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email:', emailError);
        // Continuer malgré l'erreur d'email
      }
    } catch (tokenError) {
      console.error('Erreur lors de la création du token de vérification:', tokenError);
      // Continuer malgré l'erreur de token
    }
    
    // Renvoyer l'utilisateur sans les champs sensibles
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userRole: user.userRole,
      isVerified: user.isVerified
    };
    
    res.status(201).json({ 
      message: "User registered successfully. Verification email sent.", 
      user: userResponse 
    });
    
  } catch (error) { 
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: "Server error", error: error.message }); 
  }
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

const logout = async (req, res) => {
  try {
    // Si vous utilisez des tokens JWT, vous ne pouvez pas vraiment "détruire" le token côté serveur
    // Mais vous pouvez l'ajouter à une liste noire
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      invalidatedTokens.add(token);
    }
    
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      // Pour des raisons de sécurité, nous ne révélons pas si l'email existe ou non
      return res.status(200).json({ 
        message: "If your email is registered, you will receive a password reset link shortly" 
      });
    }
    
    // Générer un token de réinitialisation
    const token = crypto.randomBytes(32).toString('hex');
    
    // Enregistrer le token dans la base de données avec une expiration (1 heure)
    const resetToken = new PasswordResetToken({
      token,
      email,
      expiresAt: Date.now() + 3600000 // 1 heure
    });
    
    await resetToken.save();
    
    // Envoyer l'email de réinitialisation
    const resetUrl = `${BASE_URL}/reset-password/${token}`;
    
    try {
      const transporter = nodemailer.createTransport({ 
        service: 'hotmail', 
        auth: { user: 'Firdaous.JEBRI@esprit.tn', pass: 'xwbcgpyxnwghflrk' }, 
        tls: { rejectUnauthorized: false }
      });
      
      await transporter.sendMail({
        from: 'Firdaous.JEBRI@esprit.tn',
        to: email,
        subject: 'Password Reset',
        html: `
          <h1>Password Reset</h1>
          <p>You requested a password reset. Click the link below to set a new password:</p>
          <a href="${resetUrl}" style="display:inline-block; background-color:#dd2825; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this reset, please ignore this email.</p>
        `
      });
      
      console.log('Password reset email sent to:', email);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      return res.status(500).json({ message: "Error sending email. Please try again." });
    }
    
    res.status(200).json({ 
      message: "If your email is registered, you will receive a password reset link shortly" 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }
    
    // Vérifier si le token existe et n'est pas expiré
    const resetToken = await PasswordResetToken.findOne({ 
      token,
      expiresAt: { $gt: Date.now() }
    });
    
    if (!resetToken) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    
    // Trouver l'utilisateur associé au token
    const user = await User.findOne({ email: resetToken.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Mettre à jour le mot de passe (le hook pre-save se chargera du hachage)
    user.password = newPassword;
    
    // S'assurer que departement est défini pour éviter les erreurs de validation
    if (user.departement === null || user.departement === undefined) {
      user.departement = 'SE'; // Valeur par défaut
    }
    
    // Si c'est un tuteur, s'assurer que academicPosition est défini
    if (user.userRole === 'TUTOR' && (!user.academicPosition || user.academicPosition === null)) {
      user.academicPosition = 'ASSISTANT'; // Valeur par défaut pour les tuteurs
    }
    
    // Enregistrer les modifications
    await user.save();
    
    // Supprimer le token de réinitialisation
    await PasswordResetToken.deleteOne({ token });
    
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Vérifie la validité du token JWT et extrait les données utilisateur
const checkTokenValidity = async (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }
    
    // Extraire le token sans le préfixe 'Bearer '
    const token = authHeader.split(' ')[1];
    
    // Vérifier si le token est dans la liste des tokens invalidés
    if (invalidatedTokens.has(token)) {
      return res.status(401).json({ message: 'Token has been invalidated' });
    }
    
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsInJvbGUiOiJTVFVERU5UIiwiaWF0IjoxNzQwMTM1NjEyLCJleHAiOjE3NDA3NDA0MTJ9.zUhKAi8PO7X8IAfPcbGw2j2LhdtuLBW6ww2E0VuthXU");
    
    // Ajouter les données utilisateur à l'objet req pour les utiliser dans les routes protégées
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Récupère les informations de l'utilisateur courant
const getCurrentUser = async (req, res) => {
  try {
    // L'ID de l'utilisateur est extrait du token par le middleware checkTokenValidity
    const userId = req.user.id;
    
    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Renvoyer les informations de l'utilisateur
    res.status(200).json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userRole: user.userRole,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      role: user.userRole // Pour uniformité avec l'authentification GitHub/Google
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export all functions
module.exports = {
  register,
  verifyEmail,
  login,
  googleLogin,
  logout,
  forgotPassword,
  resetPassword,
  checkTokenValidity,
  getCurrentUser
};