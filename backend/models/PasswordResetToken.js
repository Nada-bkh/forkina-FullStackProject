const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  email: { // Ajout du champ email
    type: String,
    required: true,
  },
  expiresAt: { // Ajout du champ expiresAt pour la date d'expiration
    type: Date,
    required: true,
  }
});

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
module.exports = PasswordResetToken;
