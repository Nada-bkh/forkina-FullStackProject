import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  InputAdornment,
  IconButton,
  FormHelperText,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

const ProjectCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: dayjs(),
    endDate: dayjs().add(30, 'day'),
    tags: []
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };
  
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };
  
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };
  
  const handleDeleteTag = (tagToDelete) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToDelete)
    }));
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to create a project');
      }
      
      const response = await fetch('http://localhost:5001/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          startDate: formData.startDate.format('YYYY-MM-DD'),
          endDate: formData.endDate.format('YYYY-MM-DD'),
          tags: formData.tags,
          status: 'RECOMMENDED'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        startDate: dayjs(),
        endDate: dayjs().add(30, 'day'),
        tags: []
      });
      
      // Redirect to project page after a delay
      setTimeout(() => {
        navigate(`/tutor/projects/${data._id}`);
      }, 1500);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, color: '#dd2825' }}>Create New Project</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Project created successfully! Redirecting...
        </Alert>
      )}
      
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Project Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Project Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(date) => handleDateChange('startDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true
                    }
                  }}
                  disabled={loading}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="End Date"
                  value={formData.endDate}
                  onChange={(date) => handleDateChange('endDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true
                    }
                  }}
                  disabled={loading}
                  minDate={formData.startDate}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Add Tags"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyPress={handleKeyPress}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleAddTag}
                        disabled={!tagInput.trim() || loading}
                      >
                        <AddIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <FormHelperText>
                Press Enter or click the Add icon to add tags
              </FormHelperText>
              
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleDeleteTag(tag)}
                    color="primary"
                    disabled={loading}
                  />
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                fullWidth
                sx={{
                  backgroundColor: '#dd2825',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#c42020'
                  }
                }}
              >
                {loading ? 'Creating...' : 'Create Project'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default ProjectCreate; 