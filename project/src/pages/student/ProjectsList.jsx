// project/src/pages/admin/ProjectsList.jsx
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Autocomplete,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import DeleteIcon from '@mui/icons-material/Delete'; // Added DeleteIcon import
import { useState } from 'react';

const ProjectsList = ({ role, projects, onEdit, onAssignClasses, onAssignTeam, onDelete, teams }) => { // Added onDelete prop
  const navigate = useNavigate();
  const [openTeamDialog, setOpenTeamDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const handleViewProject = (projectId) => {
    const path = role === 'ADMIN' ? `/admin/projects/${projectId}` : `/student/projects/${projectId}`;
    navigate(path);
  };

  const handleOpenTeamDialog = (projectId) => {
    console.log('Opening team dialog for projectId:', projectId);
    if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
      console.error('Invalid project ID:', projectId);
      return;
    }
    setSelectedProjectId(projectId);
    const project = projects.find(p => p._id === projectId);
    setSelectedTeam(project.teamRef || null);
    setOpenTeamDialog(true);
  };

  const handleAssignTeamAndClose = () => {
    console.log('Assigning team for projectId:', selectedProjectId, 'teamId:', selectedTeam ? selectedTeam._id : null);
    if (!selectedProjectId) {
      console.error('No project ID selected');
      return;
    }
    if (selectedTeam && !selectedTeam._id) {
      console.error('Selected team has no ID:', selectedTeam);
      return;
    }
    onAssignTeam(selectedProjectId, selectedTeam ? selectedTeam._id : null);
    setOpenTeamDialog(false);
    setSelectedProjectId(null);
    setSelectedTeam(null);
  };

  if (!projects || projects.length === 0) {
    return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">
            {role === 'ADMIN' ? 'No projects available' : 'You haven’t been assigned to any projects yet'}
          </Typography>
          {role === 'STUDENT' && (
              <Typography paragraph sx={{ mt: 2 }}>
                Projects assigned to you by tutors will appear here.
              </Typography>
          )}
        </Paper>
    );
  }

  return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, color: '#dd2825' }}>
          {role === 'ADMIN' ? 'All Projects' : 'My Projects'}
        </Typography>

        <Grid container spacing={3}>
          {projects.map((project) => (
              <Grid item xs={12} md={6} lg={4} key={project._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {project.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {project.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2">Status:</Typography>
                      <Chip
                          label={project.status}
                          size="small"
                          color={
                            project.status === 'COMPLETED' ? 'success' :
                                project.status === 'IN_PROGRESS' ? 'primary' :
                                    'default'
                          }
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Timeline: {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                    </Typography>
                    {role === 'ADMIN' && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Team: {project.teamRef ? project.teamRef.name : 'None'}
                        </Typography>
                    )}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {project.tags.map((tag, index) => (
                          <Chip key={index} label={tag} size="small" />
                      ))}
                    </Box>
                  </CardContent>

                  {role === 'ADMIN' && (
                      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Button startIcon={<EditIcon />} onClick={() => onEdit(project._id)}>
                          Edit
                        </Button>
                        <Button startIcon={<GroupAddIcon />} onClick={() => onAssignClasses(project._id)}>
                          Assign Classes
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => handleOpenTeamDialog(project._id)}
                            sx={{
                              backgroundColor: '#dd2825',
                              color: 'white',
                              '&:hover': { backgroundColor: '#c42020' }
                            }}
                        >
                          Assign Team
                        </Button>
                        <Button
                            startIcon={<DeleteIcon />}
                            color="error"
                            onClick={() => onDelete(project._id)} // Added delete button
                        >
                          Delete
                        </Button>
                      </Box>
                  )}

                  <CardActions>
                    <Button
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewProject(project._id)}
                        fullWidth
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>

                {/* Dialog for team assignment */}
                <Dialog open={openTeamDialog} onClose={() => setOpenTeamDialog(false)}>
                  <DialogTitle>Assign Team to {projects.find(p => p._id === selectedProjectId)?.name}</DialogTitle>
                  <DialogContent>
                    <Autocomplete
                        options={teams || []}
                        getOptionLabel={(option) => option.name || ''}
                        value={selectedTeam}
                        onChange={(event, newValue) => setSelectedTeam(newValue)}
                        renderInput={(params) => (
                            <TextField {...params} label="Select Team" variant="outlined" fullWidth />
                        )}
                        sx={{ mt: 2, width: 300 }}
                        isOptionEqualToValue={(option, value) => option._id === value?._id}
                    />
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setOpenTeamDialog(false)}>Cancel</Button>
                    <Button onClick={() => handleAssignTeamAndClose()}>Save</Button>
                  </DialogActions>
                </Dialog>
              </Grid>
          ))}
        </Grid>
      </Box>
  );
};

export default ProjectsList;