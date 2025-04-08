import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  FormControl,
  FormHelperText,
  Select,
  InputLabel,
  Divider,
  Alert,
  IconButton,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const ProjectApply = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    teamName: '',
    projectId: '',
    priority: 1,
    motivationLetter: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [wordCount, setWordCount] = useState(0);

  // Fetch approved projects
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['approved-projects'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5001/api/projects', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data.filter(project => project.status === 'APPROVED');
    }
  });

  // Fetch student's existing applications
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['student-applications'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5001/api/project-applications', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    }
  });

  // Submit application mutation
  const submitMutation = useMutation({
    mutationFn: async (data) => {
      return await axios.post('http://localhost:5001/api/project-applications', data, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['student-applications']);
      
      // Reset form but determine the next priority correctly
      let nextPriority = 1;
      if (applications) {
        const hasPriority1 = applications.some(app => app.priority === 1);
        if (hasPriority1) {
          nextPriority = 2;
        }
      }
      
      setFormData({
        teamName: formData.teamName, // Keep team name
        projectId: '',
        priority: nextPriority,
        motivationLetter: ''
      });
      setWordCount(0);
    }
  });

  // Cancel application mutation
  const cancelMutation = useMutation({
    mutationFn: async (applicationId) => {
      return await axios.delete(`http://localhost:5001/api/project-applications/${applicationId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['student-applications']);
    }
  });

  useEffect(() => {
    // Update selected projects based on applications
    if (applications) {
      const projectIds = applications.map(app => app.project._id);
      setSelectedProjects(projectIds);
      
      // Set next priority based on existing applications
      if (applications.length > 0) {
        // Check if priority 1 exists
        const hasPriority1 = applications.some(app => app.priority === 1);
        // Check if priority 2 exists
        const hasPriority2 = applications.some(app => app.priority === 2);
        
        if (!hasPriority1) {
          setFormData(prev => ({ ...prev, priority: 1 }));
        } else if (!hasPriority2) {
          setFormData(prev => ({ ...prev, priority: 2 }));
        }
      } else {
        // No applications yet, set priority to 1
        setFormData(prev => ({ ...prev, priority: 1 }));
      }
    }
  }, [applications]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });

    // Count words for motivation letter
    if (name === 'motivationLetter') {
      const words = value.trim() ? value.trim().split(/\s+/).length : 0;
      setWordCount(words);
    }

    // Clear errors on change
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const validate = () => {
    const errors = {};
    
    if (!formData.teamName.trim()) {
      errors.teamName = 'Le nom d\'équipe est obligatoire';
    }
    
    if (!formData.projectId) {
      errors.projectId = 'Veuillez sélectionner un projet';
    }
    
    if (!formData.motivationLetter.trim()) {
      errors.motivationLetter = 'La lettre de motivation est obligatoire';
    } else if (wordCount > 250) {
      errors.motivationLetter = 'La lettre de motivation ne doit pas dépasser 250 mots';
    }
    
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    submitMutation.mutate(formData);
  };

  const handleCancel = (applicationId) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette candidature ?')) {
      cancelMutation.mutate(applicationId);
    }
  };

  const isLoading = projectsLoading || applicationsLoading;
  const canApply = applications ? applications.length < 2 : true;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, color: '#dd2825' }}>
        Candidater aux projets
      </Typography>
      
      {(submitMutation.isError || cancelMutation.isError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitMutation.error?.response?.data?.error || 
           cancelMutation.error?.response?.data?.error || 
           'Une erreur est survenue'}
        </Alert>
      )}
      
      {submitMutation.isSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Votre candidature a été soumise avec succès
        </Alert>
      )}
      
      {isLoading ? (
        <LinearProgress sx={{ mb: 3 }} />
      ) : (
        <>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
            Vous pouvez au maximum choisir 2 sujets
            </Typography>
            
            {applications && applications.length === 0 ? (
              <Typography>Vous n'avez pas encore soumis de candidature</Typography>
            ) : (
              <Grid container spacing={2}>
                {applications && applications.map((app) => (
                  <Grid item xs={12} md={6} key={app._id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6">
                            {app.project.name}
                          </Typography>
                          <Chip 
                            label={`Choix ${app.priority}`} 
                            color={app.priority === 1 ? "error" : "info"} 
                            sx={{ 
                              fontWeight: 'bold',
                              background: app.priority === 1 ? '#dd2825' : '#3f51b5',
                              color: 'white'
                            }}
                            size="small" 
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Équipe: {app.teamName}
                        </Typography>
                        {app.project.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                            {app.project.description.length > 100 
                              ? `${app.project.description.substring(0, 100)}...` 
                              : app.project.description}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          Statut: {app.status === 'PENDING' ? 'En attente' : app.status === 'ACCEPTED' ? 'Acceptée' : 'Rejetée'}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          {app.status === 'PENDING' && (
                            <Button 
                              variant="outlined" 
                              color="error" 
                              size="small"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleCancel(app._id)}
                            >
                              Annuler
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
          
          {canApply ? (
            <Paper component="form" sx={{ p: 3 }} onSubmit={handleSubmit}>
              <Typography variant="h6" gutterBottom>
                Choix {applications && `(${applications.length + 1}/2)`}
              </Typography>
              
              <TextField
                label="Nom d'équipe"
                name="teamName"
                value={formData.teamName}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                error={!!formErrors.teamName}
                helperText={formErrors.teamName}
              />
              
              <FormControl fullWidth margin="normal" error={!!formErrors.projectId}>
                <InputLabel id="project-select-label">Projet</InputLabel>
                <Select
                  labelId="project-select-label"
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleChange}
                  label="Projet"
                  disabled={selectedProjects.length >= 2}
                >
                  {projects && projects
                    .filter(p => !selectedProjects.includes(p._id))
                    .map(project => (
                      <MenuItem key={project._id} value={project._id}>
                        {project.name}
                      </MenuItem>
                    ))}
                </Select>
                {formErrors.projectId && <FormHelperText>{formErrors.projectId}</FormHelperText>}
              </FormControl>
              
              <TextField
                label="Lettre de motivation"
                name="motivationLetter"
                value={formData.motivationLetter}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
                margin="normal"
                error={!!formErrors.motivationLetter}
                helperText={formErrors.motivationLetter || `${wordCount}/250 mots`}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large"
                  disabled={submitMutation.isLoading || selectedProjects.length >= 2}
                >
                  {submitMutation.isLoading ? 'Envoi en cours...' : 'Soumettre'}
                </Button>
              </Box>
            </Paper>
          ) : (
            <Alert severity="info">
             Vous pouvez annuler une candidature en attente pour en soumettre une nouvelle.
            </Alert>
          )}
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button 
              component={Link} 
              to="/student/projects" 
              variant="outlined"
            >
              Retour à la liste des projets
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ProjectApply; 