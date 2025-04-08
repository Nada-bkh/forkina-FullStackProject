import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Chip, 
  Grid, 
  TextField, 
  InputAdornment, 
  LinearProgress, 
  Divider, 
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tab,
  Tabs,
  Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const AdminProjectsReview = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [action, setAction] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      
      let url;
      if (tabValue === 0) {
        // Recommended projects tab
        url = 'http://localhost:5001/api/projects/recommended';
      } else {
        // All projects tab
        url = 'http://localhost:5001/api/projects';
      }
      
      if (searchQuery) url += `${url.includes('?') ? '&' : '?'}search=${encodeURIComponent(searchQuery)}`;
      
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
  }, [tabValue]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleSearch = (e) => { e.preventDefault(); fetchProjects(); };
  const handleTabChange = (event, newValue) => setTabValue(newValue);
  const handleViewProject = (projectId) => navigate(`/admin/projects/${projectId}`);

  const handleOpenDialog = (project, actionType) => {
    setSelectedProject(project);
    setAction(actionType);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProject(null);
    setAction('');
  };

  const handleApproveProject = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You must be logged in to approve this project');
      
      const response = await fetch(`http://localhost:5001/api/projects/${selectedProject._id}/approve`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to approve project');
      
      setSuccessMessage(`Project "${selectedProject.name}" has been approved successfully`);
      setTimeout(() => setSuccessMessage(''), 5000);
      handleCloseDialog();
      fetchProjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectProject = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You must be logged in to reject this project');
      
      const response = await fetch(`http://localhost:5001/api/projects/${selectedProject._id}/reject`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to reject project');
      
      setSuccessMessage(`Project "${selectedProject.name}" has been rejected`);
      setTimeout(() => setSuccessMessage(''), 5000);
      handleCloseDialog();
      fetchProjects();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#dd2825' }}>Projects Administration</Typography>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>
      )}
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Projects Pending Approval" />
          <Tab label="All Projects" />
        </Tabs>
      </Paper>

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
          <Typography variant="h6" sx={{ mb: 2 }}>
            {tabValue === 0 ? 'No projects pending approval' : 'No projects found'}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {searchQuery ? "No projects match your search criteria. Try different keywords." : tabValue === 0 ? "There are no projects waiting for your approval at the moment." : "No projects available in the system."}
          </Typography>
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
                  
                  {/* Tutor information */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: '#dd2825' }}>
                      <PersonIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Typography variant="body2">
                      {project.tutorRef?.firstName} {project.tutorRef?.lastName}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary"><strong>Submitted:</strong> {dayjs(project.creationDate || project.createdAt).format('MMM D, YYYY')}</Typography>
                    {project.startDate && (
                      <Typography variant="body2" color="text.secondary"><strong>Planned Start:</strong> {dayjs(project.startDate).format('MMM D, YYYY')}</Typography>
                    )}
                    {project.endDate && (
                      <Typography variant="body2" color="text.secondary"><strong>Planned End:</strong> {dayjs(project.endDate).format('MMM D, YYYY')}</Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {project.tags && project.tags.map(tag => (
                      <Chip key={tag} label={tag} size="small" sx={{ backgroundColor: '#f1f1f1' }} />
                    ))}
                  </Box>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'space-between', p: 1 }}>
                  <Button 
                    size="small" 
                    startIcon={<VisibilityIcon />} 
                    onClick={() => handleViewProject(project._id)}
                  >
                    View Details
                  </Button>
                  {project.status === 'RECOMMENDED' && (
                    <Box>
                      <Button 
                        size="small" 
                        startIcon={<CheckCircleIcon />} 
                        onClick={() => handleOpenDialog(project, 'approve')}
                        color="success"
                        variant="contained"
                        sx={{ mr: 1 }}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<CancelIcon />} 
                        onClick={() => handleOpenDialog(project, 'reject')}
                        color="error"
                        variant="outlined"
                      >
                        Reject
                      </Button>
                    </Box>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {action === 'approve' ? 'Approve Project?' : 'Reject Project?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {action === 'approve' 
              ? `Are you sure you want to approve the project "${selectedProject?.name}"? This will make the project active in the system.`
              : `Are you sure you want to reject the project "${selectedProject?.name}"? The tutor will be notified about this decision.`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {action === 'approve' ? (
            <Button onClick={handleApproveProject} color="success" variant="contained">
              Approve
            </Button>
          ) : (
            <Button onClick={handleRejectProject} color="error" variant="contained">
              Reject
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminProjectsReview;