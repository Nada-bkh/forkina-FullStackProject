import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  IconButton, 
  Tooltip, 
  LinearProgress, 
  Chip,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import { deleteProject, fetchAllProjects } from '../../api/projectApi';

const ProjectsList = ({ role, projects: initialProjects, onEdit, onAssignClasses }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState(initialProjects || []);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (initialProjects) {
      setProjects(initialProjects);
      filterProjects(tabValue, initialProjects);
    } else {
      loadProjects();
    }
  }, [initialProjects]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await fetchAllProjects('TUTOR');
      setProjects(data);
      filterProjects(tabValue, data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    filterProjects(newValue, projects);
  };

  const filterProjects = (tabIndex, projectsToFilter) => {
    switch (tabIndex) {
      case 0: // All
        setFilteredProjects(projectsToFilter);
        break;
      case 1: // Recommended
        setFilteredProjects(projectsToFilter.filter(p => p.approvalStatus === 'RECOMMENDED'));
        break;
      case 2: // Approved
        setFilteredProjects(projectsToFilter.filter(p => p.approvalStatus === 'APPROVED'));
        break;
      case 3: // Rejected
        setFilteredProjects(projectsToFilter.filter(p => p.approvalStatus === 'REJECTED'));
        break;
      default:
        setFilteredProjects(projectsToFilter);
    }
  };

  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(projectId);
        await loadProjects();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleViewProject = (projectId) => {
    navigate(`/tutor/projects/${projectId}`);
  };

  const handleCreateProject = () => {
    navigate('/tutor/projects/create');
  };

  const handleEditProject = (projectId) => {
    if (onEdit) {
      onEdit(projectId);
    } else {
      navigate(`/tutor/projects/${projectId}/edit`);
    }
  };

  const getApprovalStatusChip = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Chip label="Approved" size="small" color="success" sx={{ ml: 1 }} />;
      case 'REJECTED':
        return <Chip label="Rejected" size="small" color="error" sx={{ ml: 1 }} />;
      case 'RECOMMENDED':
        return <Chip label="Pending Approval" size="small" color="warning" sx={{ ml: 1 }} />;
      default:
        return null;
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#dd2825' }}>
          Mes Projets
        </Typography>
        <Button
  variant="contained"
  startIcon={<AddIcon />}
  onClick={handleCreateProject}
  sx={{ 
    backgroundColor: '#dd2825', 
    color: '#fff',
    '&:hover': { backgroundColor: '#c42020' } 
  }}
>
  Créer un projet
</Button>
      </Box>
    
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="project status tabs">
          <Tab label="All Projects" />
          <Tab label="Pending Approval" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {filteredProjects.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: 'center', p: 3 }}>
          No projects found in this category.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {filteredProjects.map((project) => {
            console.log('Project in list:', project);
            const projectId = project._id;
            if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
              console.error('Invalid project ID in ProjectsList:', projectId);
              return null;
            }
            return (
              <Card key={projectId} sx={{ minWidth: 275, maxWidth: 300, mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="div">
                      {project.name}
                    </Typography>
                    {getApprovalStatusChip(project.approvalStatus)}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {project.description || 'No description'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {project.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start: {new Date(project.startDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    End: {new Date(project.endDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Classes: {project.classes && project.classes.length > 0
                      ? project.classes.map(cls => cls.name).join(', ')
                      : 'None'}
                  </Typography>
                  {project.tags && project.tags.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {project.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </Box>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Button 
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewProject(projectId)}
                    size="small"
                  >
                    View
                  </Button>
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleEditProject(projectId)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDelete(projectId)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardActions>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default ProjectsList;