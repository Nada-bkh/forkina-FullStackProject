import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, CardActions, Button, IconButton, Tooltip, LinearProgress, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { deleteProject } from '../../api/projectApi';

const ProjectsList = ({ role, projects, onEdit, onAssignClasses }) => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(projectId);
        navigate(0);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleManageTasks = (projectId) => {
    navigate(`/admin/projects/${projectId}/tasks`);
  };

  if (!projects) return <LinearProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {projects.map((project) => {
          console.log('Project in list:', project);
          const projectId = project._id;
          if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
            console.error('Invalid project ID in ProjectsList:', projectId);
            return null;
          }
          return (
              <Card key={projectId} sx={{ minWidth: 275, maxWidth: 300, mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" component="div">
                    {project.name}
                  </Typography>
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
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <Tooltip title="View Details">
                    <IconButton onClick={() => navigate(`/admin/projects/${projectId}`)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  {role === 'ADMIN' && (
                      <Tooltip title="Assign Classes">
                        <IconButton onClick={() => onAssignClasses(projectId)}>
                          <GroupAddIcon />
                        </IconButton>
                      </Tooltip>
                  )}
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(projectId)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => handleManageTasks(projectId)}
                  >
                    Manage Tasks
                  </Button>
                </CardActions>
              </Card>
          );
        })}
      </Box>
  );
};

export default ProjectsList;