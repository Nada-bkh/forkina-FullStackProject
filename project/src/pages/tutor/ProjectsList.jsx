import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Card, CardContent, CardActions, Button, Chip, Grid, TextField, InputAdornment, LinearProgress, IconButton, Divider, Alert } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const ProjectsList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusColor = (status) => {
    switch (status) {
      case 'RECOMMENDED': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'PENDING': return 'default';
      case 'IN_PROGRESS': return 'primary';
      case 'COMPLETED': return 'success';
      case 'ARCHIVED': return 'secondary';
      default: return 'default';
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You must be logged in to view projects');
      let url = 'http://localhost:5001/api/projects';
      if (searchQuery) url += `?search=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch projects');
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleSearch = (e) => { e.preventDefault(); fetchProjects(); };
  const handleCreateProject = () => navigate('/tutor/projects/create');
  const handleViewProject = (projectId) => navigate(`/tutor/projects/${projectId}`);
  const handleEditProject = (projectId) => navigate(`/tutor/projects/${projectId}/edit`);
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You must be logged in to delete a project');
      const response = await fetch(`http://localhost:5001/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete project');
      fetchProjects();
    } catch (err) {
      setError(err.message);
      alert('Error: ' + err.message);
    }
  };
  const handleManageTasks = (projectId) => navigate(`/tutor/projects/${projectId}/tasks`);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#dd2825' }}>My Projects</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateProject} sx={{ backgroundColor: '#dd2825', '&:hover': { backgroundColor: '#c42020' } }}>
          Create Project
        </Button>
      </Box>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        When you create a new project, it will be in "RECOMMENDED" status and needs admin approval before becoming active.
      </Alert>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleSearch}>
          <TextField
            fullWidth
            placeholder="Search projects by name, description, or tags..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              endAdornment: <InputAdornment position="end"><Button type="submit" variant="contained" size="small">Search</Button></InputAdornment>
            }}
          />
        </form>
      </Paper>
      {loading ? (
        <LinearProgress />
      ) : projects.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>No projects found</Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {searchQuery ? "No projects match your search criteria. Try different keywords." : "You haven't created any projects yet. Click 'Create Project' to get started."}
          </Typography>
          {!searchQuery && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateProject} sx={{ backgroundColor: '#dd2825', '&:hover': { backgroundColor: '#c42020' } }}>
              Create Your First Project
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map(project => (
            <Grid item xs={12} md={6} lg={4} key={project._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' } }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }}>{project.name}</Typography>
                    <Chip label={project.status.replace('_', ' ')} color={getStatusColor(project.status)} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: '3em', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{project.description}</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary"><strong>Start:</strong> {dayjs(project.startDate).format('MMM D, YYYY')}</Typography>
                    <Typography variant="body2" color="text.secondary"><strong>End:</strong> {dayjs(project.endDate).format('MMM D, YYYY')}</Typography>
                  </Box>
                  {project.progressPercentage !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ width: '100%', mr: 1 }}><LinearProgress variant="determinate" value={project.progressPercentage} sx={{ height: 8, borderRadius: 5, backgroundColor: '#e0e0e0' }} /></Box>
                      <Box><Typography variant="body2" color="text.secondary">{`${Math.round(project.progressPercentage)}%`}</Typography></Box>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{project.tags && project.tags.map(tag => <Chip key={tag} label={tag} size="small" sx={{ backgroundColor: '#f1f1f1' }} />)}</Box>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'space-between', p: 1 }}>
                  <Box>
                    <IconButton size="small" onClick={() => handleViewProject(project._id)} title="View Project"><VisibilityIcon /></IconButton>
                    <IconButton size="small" onClick={() => handleEditProject(project._id)} title="Edit Project"><EditIcon /></IconButton>
                    <IconButton size="small" onClick={() => handleDeleteProject(project._id)} title="Delete Project" color="error"><DeleteIcon /></IconButton>
                  </Box>
                  <Button size="small" startIcon={<AssignmentIcon />} onClick={() => handleManageTasks(project._id)} sx={{ color: '#dd2825' }}>Manage Tasks</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ProjectsList;