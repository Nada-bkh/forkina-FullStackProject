const express = require("express");
const { register, login, logout, forgotPassword, resetPassword, checkTokenValidity, googleLogin } = require("../controllers/authController");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/logout", checkTokenValidity, logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
