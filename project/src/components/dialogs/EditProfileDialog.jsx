import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Avatar,
  Typography
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import Swal from 'sweetalert2';

const EditProfileDialog = ({ open, onClose, user, onUpdate }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    educationLevel: user?.educationLevel || '',
    profilePicture: user?.profilePicture || '',
    cin: user?.cin || '',
    classe: user?.classe || '--'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newProfilePicture, setNewProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Reset form when dialog opens with new user data
  useEffect(() => {
    if (open) {
      setFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        educationLevel: user?.educationLevel || '',
        profilePicture: user?.profilePicture || '',
        cin: user?.cin || '',
        classe: user?.classe || '--'
      });
      setNewProfilePicture(null);
      setPreviewUrl(null);
      setError('');
    }
  }, [open, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    setNewProfilePicture(file);
    setError(''); // Clear any previous errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      let updatedData = { ...formData };

      if (newProfilePicture) {
        const imageFormData = new FormData();
        imageFormData.append('faceImage', newProfilePicture);

        const imageResponse = await fetch('http://localhost:5001/api/face-detection/upload', {
          method: 'POST',
          body: imageFormData
        });

        if (!imageResponse.ok) {
          throw new Error('Failed to upload profile picture');
        }

        const imageData = await imageResponse.json();
        updatedData.profilePicture = imageData.filePath;
      }

      const response = await fetch(`http://localhost:5001/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      onUpdate(updatedUser);
      onClose();
      
      // Updated success message styling with auto-close
      setTimeout(() => {
        Swal.fire({
          icon: 'success',
          title: 'Good job!',
          text: 'Profile updated successfully!',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          customClass: {
            popup: 'swal2-popup-custom',
            icon: 'swal2-icon-custom'
          },
          width: '400px',
          padding: '2em',
          showClass: {
            popup: 'animate__animated animate__fadeIn'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOut'
          }
        });
      }, 100);
      
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message);
      
      // Error message styling
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: err.message || 'Failed to update profile',
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
        customClass: {
          popup: 'swal2-popup-custom',
          icon: 'swal2-icon-custom'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          overflowY: 'auto'
        }
      }}
    >
      <DialogTitle>Edit Profile</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* Profile Picture Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Avatar
              src={previewUrl || (formData.profilePicture ? `http://localhost:5001${formData.profilePicture}` : 
                   (user?.faceImage ? `http://localhost:5001${user.faceImage}` : null))}
              sx={{
                width: 100,
                height: 100,
                mb: 2,
                bgcolor: '#dd2825'
              }}
            >
              {!previewUrl && !formData.profilePicture && !user?.faceImage && user?.firstName?.charAt(0)}
            </Avatar>
            
            <Button
              component="label"
              variant="contained"
              startIcon={<PhotoCamera />}
              sx={{
                mb: 2,
                bgcolor: '#dd2825',
                '&:hover': { bgcolor: 'rgba(221, 40, 37, 0.9)' },
                color: 'white'
              }}
            >
              Change Picture
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
            
            <Typography variant="caption" color="textSecondary">
              Click to upload a new profile picture (max 5MB)
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              name="firstName"
              label="First Name"
              value={formData.firstName}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              name="lastName"
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              name="email"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              type="email"
            />
            {user?.userRole === 'STUDENT' && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Education Level</InputLabel>
                  <Select
                    name="educationLevel"
                    value={formData.educationLevel}
                    onChange={handleChange}
                    label="Education Level"
                  >
                    <MenuItem value="BEGINNER">Beginner</MenuItem>
                    <MenuItem value="INTERMEDIATE">Intermediate</MenuItem>
                    <MenuItem value="ADVANCED">Advanced</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  name="cin"
                  label="CIN (Carte d'Identité Nationale)"
                  value={formData.cin}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ maxLength: 8 }}
                  helperText="Numéro d'identité nationale"
                />
                
                {/* Classe modifiable uniquement par l'administrateur */}
                <TextField
                  name="classe"
                  label="Classe"
                  value={formData.classe}
                  onChange={handleChange}
                  fullWidth
                  disabled={user.userRole !== 'ADMIN'} // Désactivé si l'utilisateur n'est pas admin
                  helperText={user.userRole !== 'ADMIN' ? "Seul l'administrateur peut modifier ce champ" : "Indiquez la classe de l'étudiant"}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={loading}
            sx={{ 
              bgcolor: '#dd2825',
              '&:hover': { bgcolor: 'rgba(221, 40, 37, 0.9)' },
              color: 'white'
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditProfileDialog;