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

// Register function
const register = async (req, res) => {
  const { firstName, lastName, email, password, role, adminSecret } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });
    const user = new User({ firstName, lastName, email, password, userRole: role || "STUDENT", isVerified: false });
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
const login = async (req, res) => res.status(200).json({ message: "Login function is missing" });
const googleLogin = async (req, res) => res.status(200).json({ message: "Google login function is missing" });
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
