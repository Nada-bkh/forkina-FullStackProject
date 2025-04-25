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
  DialogActions,
  Tooltip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { useState } from 'react';

const ProjectsList = ({ role, projects, onEdit, onAssignClasses, onAssignTeam, onDelete, onApprove, onReject, teams }) => {
  const navigate = useNavigate();
  const [openTeamDialog, setOpenTeamDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedTeams, setSelectedTeams] = useState([]);

  const handleViewProject = (projectId) => {
    const path = role === 'ADMIN' ? `/admin/projects/${projectId}` : `/student/projects/${projectId}`;
    navigate(path);
  };

  const handleOpenTeamDialog = (projectId) => {
    if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) return;
    setSelectedProjectId(projectId);
    const project = projects.find(p => p._id === projectId);
    setSelectedTeams(project.teamRef || []);
    setOpenTeamDialog(true);
  };

  const handleAssignTeamAndClose = () => {
    if (!selectedProjectId) return;
    onAssignTeam(selectedProjectId, selectedTeams.map(team => team._id));
    setOpenTeamDialog(false);
    setSelectedProjectId(null);
    setSelectedTeams([]);
  };

  const getApprovalStatusChip = (status) => {
    switch (status) {
      case 'APPROVED': return <Chip label="Approved" size="small" color="success" sx={{ ml: 1 }} />;
      case 'REJECTED': return <Chip label="Rejected" size="small" color="error" sx={{ ml: 1 }} />;
      case 'RECOMMENDED': return <Chip label="Recommended" size="small" color="warning" sx={{ ml: 1 }} />;
      default: return null;
    }
  };

  if (!projects?.length) {
    return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">
            {role === 'ADMIN' ? 'No projects available' : 'You haven\'t been assigned to any projects yet'}
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        {project.name}
                      </Typography>
                      {getApprovalStatusChip(project.approvalStatus)}
                    </Box>

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
                        <>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Teams: {project.teamRef?.map(team => team.name).join(', ') || 'None'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Classes: {project.classes?.map(cls => cls.name).join(', ') || 'None'}
                          </Typography>
                        </>
                    )}

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {project.tags.map((tag, index) => (
                          <Chip key={index} label={tag} size="small" />
                      ))}
                    </Box>

                    {/* Team Assignment Display for Students */}
                    {role === 'STUDENT' && project.teamRef?.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                            Your Team Assignment:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {project.teamRef.map((team) => (
                                <Chip
                                    key={team._id}
                                    label={team.name}
                                    size="small"
                                    sx={{
                                      bgcolor: '#dd2825',
                                      color: 'white',
                                      '& .MuiChip-label': { fontWeight: 500 }
                                    }}
                                />
                            ))}
                          </Box>
                        </Box>
                    )}
                  </CardContent>

                  {role === 'ADMIN' && (
                      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Button startIcon={<EditIcon />} onClick={() => onEdit(project._id)}>
                          Edit
                        </Button>
                        <Button
                            startIcon={<DeleteIcon />}
                            color="error"
                            onClick={() => onDelete(project._id)}
                        >
                          Delete
                        </Button>

                        {project.approvalStatus === 'RECOMMENDED' && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, width: '100%', justifyContent: 'center' }}>
                              <Tooltip title="Approve Project">
                                <Button
                                    startIcon={<ThumbUpIcon />}
                                    color="success"
                                    variant="outlined"
                                    onClick={() => onApprove(project._id)}
                                >
                                  Approve
                                </Button>
                              </Tooltip>
                              <Tooltip title="Reject Project">
                                <Button
                                    startIcon={<ThumbDownIcon />}
                                    color="error"
                                    variant="outlined"
                                    onClick={() => onReject(project._id)}
                                >
                                  Reject
                                </Button>
                              </Tooltip>
                            </Box>
                        )}
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

                <Dialog open={openTeamDialog} onClose={() => setOpenTeamDialog(false)}>
                  <DialogTitle>Assign Teams to {projects.find(p => p._id === selectedProjectId)?.name}</DialogTitle>
                  <DialogContent>
                    <Autocomplete
                        multiple
                        options={teams || []}
                        getOptionLabel={(option) => option.name || ''}
                        value={selectedTeams}
                        onChange={(event, newValue) => setSelectedTeams(newValue)}
                        renderInput={(params) => (
                            <TextField {...params} label="Select Teams" variant="outlined" fullWidth />
                        )}
                        sx={{ mt: 2, width: 300 }}
                        isOptionEqualToValue={(option, value) => option._id === value?._id}
                    />
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setOpenTeamDialog(false)}>Cancel</Button>
                    <Button onClick={handleAssignTeamAndClose}>Save</Button>
                  </DialogActions>
                </Dialog>
              </Grid>
          ))}
        </Grid>
      </Box>
  );
};

export default ProjectsList;