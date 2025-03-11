
// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const User = require('../models/userModel');
const authMiddleware = require('../middlewares/authMiddleware');

// Get user profile - this specific route should come before the /:id route
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const updateData = req.body;
    
    // Vérifier si l'utilisateur est autorisé à mettre à jour ce profil
    // Les administrateurs peuvent mettre à jour n'importe quel profil
    // Les utilisateurs normaux ne peuvent mettre à jour que leur propre profil
    if (req.user.id !== req.params.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mise à jour conditionnelle des champs - ne mettre à jour que les champs présents dans la requête
    if (updateData.firstName !== undefined) user.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) user.lastName = updateData.lastName;
    if (updateData.email !== undefined) user.email = updateData.email;
    if (updateData.profilePicture !== undefined) user.profilePicture = updateData.profilePicture;
    if (updateData.educationLevel !== undefined && user.userRole === 'STUDENT') {
      user.educationLevel = updateData.educationLevel;
    }
    
    // Mise à jour du statut du compte
    if (updateData.accountStatus !== undefined) {
      user.accountStatus = updateData.accountStatus;
    }
    
    // Seuls les administrateurs peuvent modifier le rôle et la classe d'un utilisateur
    if (req.user.role === 'ADMIN') {
      // Update role if provided
      if (updateData.userRole !== undefined) {
        user.userRole = updateData.userRole;
      }
      
      // Update class for students
      if (user.userRole === 'STUDENT' && updateData.classe !== undefined) {
        user.classe = updateData.classe;
      }
    }
    
    // Mettre à jour le CIN si fourni et si c'est un étudiant
    if (user.userRole === 'STUDENT' && updateData.cin !== undefined) {
      user.cin = updateData.cin;
    }

    // Update department
    if (updateData.department !== undefined) {
      user.department = updateData.department;
    }

    // Update birth date
    if (updateData.birthDate !== undefined) {
      user.birthDate = updateData.birthDate;
    }

    // Save updated user
    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(req.params.id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Other routes
router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.delete('/:id', userController.deleteUser);

module.exports = router;