// controllers/userController.js
const User = require('../models/userModel');

exports.createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    return res.status(201).json(user);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};
    
    if (role) {
      query.userRole = role.toUpperCase();
    }
    
    const users = await User.find(query).populate('teamRef');
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('teamRef');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    console.log('Updating user with ID:', req.params.id);
    console.log('Update data:', req.body);

    const updateData = { ...req.body };
    
    // Process special fields as needed
    if (updateData.userRole) {
      console.log('Updating user role to:', updateData.userRole);
    }

    // Use $set to update only the fields provided
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Updated user:', user);
    return res.json(user);
  } catch (err) {
    console.error('Update error:', err);
    return res.status(400).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    console.log('Attempting to delete user with ID:', req.params.id);
    
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('User not found for deletion');
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    console.log('User successfully deleted');
    
    return res.json({ 
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        email: user.email,
        userRole: user.userRole
      }
    });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ message: err.message });
  }
};
