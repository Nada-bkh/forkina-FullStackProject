const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const path = require('path');
const fs = require('fs');
const User = require('../models/userModel');
const { getFaceDescriptor, compareFaceDescriptors } = require('../utils/faceRecognition');

// Route to handle face image uploads
router.post('/upload', upload.single('faceImage'), async (req, res) => {
  try {
    console.log('File upload request received:', req.file);
    

    
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get face descriptor from the uploaded image
    const faceDescriptor = await getFaceDescriptor(req.file.path);
    
    if (!faceDescriptor) {
      console.error('No face detected in the uploaded image');
      return res.status(400).json({ message: 'No face detected in the image' });
    }

    // Return the file path and descriptor that can be stored in the user model
    const filePath = `/uploads/${req.file.filename}`;
    console.log('File uploaded successfully:', filePath);
    
    return res.status(200).json({ 
      message: 'File uploaded successfully',
      filePath: filePath,
      faceDescriptor: Array.from(faceDescriptor) // Convert Float32Array to regular array for JSON
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

// Route to serve the uploaded images
router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, '../uploads', filename);
  console.log('Attempting to serve file:', filepath);
  
  // Check if file exists
  if (fs.existsSync(filepath)) {
    return res.sendFile(filepath);
  } else {
    console.error('File not found:', filepath);
    return res.status(404).json({ message: 'File not found' });
  }
});

// Route for face recognition login
router.post('/login', upload.single('faceImage'), async (req, res) => {
  try {
    console.log('Face login request received:', req.file);
    
    if (!req.file) {
      console.error('No face image in request');
      return res.status(400).json({ message: 'No face image uploaded' });
    }

    // Get face descriptor from the uploaded image
    const loginFaceDescriptor = await getFaceDescriptor(req.file.path);
    
    if (!loginFaceDescriptor) {
      console.error('No face detected in the login image');
      return res.status(400).json({ message: 'No face detected in the image' });
    }
    
    // Get all users with face descriptors
    const users = await User.find({ 
      faceDescriptor: { $exists: true, $ne: null }
    });
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'No users with face data found' });
    }
    
    // Compare the login face with all stored faces
    let bestMatch = null;
    let bestUser = null;
    
    for (const user of users) {
      // Skip users without face descriptors
      if (!user.faceDescriptor || user.faceDescriptor.length === 0) {
        continue;
      }
      
      // Convert stored array back to Float32Array for comparison
      const storedDescriptor = new Float32Array(user.faceDescriptor);
      
      // Compare faces
      const matchResult = compareFaceDescriptors(loginFaceDescriptor, storedDescriptor);
      
      // Check if this is a match and better than previous matches
      if (matchResult.match && (!bestMatch || matchResult.similarity > bestMatch.similarity)) {
        bestMatch = matchResult;
        bestUser = user;
      }
    }
    
    // If we found a match
    if (bestMatch && bestUser) {
      console.log(`Face login successful for user: ${bestUser.email}`);
      
      // Update login stats
      bestUser.lastLogin = new Date();
      bestUser.loginCount += 1;
      await bestUser.save();
      
      // Generate auth token
      const token = bestUser.generateToken();
      
      // Return user data and token
      return res.status(200).json({
        message: 'Face recognition successful',
        similarity: bestMatch.similarity.toFixed(2),
        user: {
          id: bestUser._id,
          firstName: bestUser.firstName,
          lastName: bestUser.lastName,
          email: bestUser.email,
          role: bestUser.userRole
        },
        token
      });
    } else {
      // No match found
      console.log('No matching face found');
      return res.status(401).json({ message: 'Face not recognized' });
    }
  } catch (error) {
    console.error('Face login error:', error);
    return res.status(500).json({ message: 'Face login failed', error: error.message });
  } finally {
    // Clean up the uploaded file
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, err => {
        if (err) console.error('Error removing login face image:', err);
      });
    }
  }
});

module.exports = router;