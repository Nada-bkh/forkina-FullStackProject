import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
    CircularProgress,
    Alert,
    Avatar,
    AvatarGroup,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tooltip
} from '@mui/material';
import {
    Code,
    GitHub,
    CalendarToday,
    Task, GroupWork
} from '@mui/icons-material';
import { api } from '../../api/axiosConfig';

const TeamProjects = () => {
    const navigate = useNavigate();
    const [selectedProject, setSelectedProject] = useState(null);
    const [githubUrl, setGithubUrl] = useState('');
    const [validationError, setValidationError] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    const { data: projects = [], isLoading, error } = useQuery({
        queryKey: ['teamProjects'],
        queryFn: async () => {
            const response = await api.get('/assignments/team-projects');
            return response.data;
        },
        staleTime: 300000
    });

    const isValidGitHubUrl = (url) => {
        const pattern = /^https?:\/\/github.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;
        return pattern.test(url);
    };

    const handleAddRepository = (project) => {
        setSelectedProject(project);
        setGithubUrl('');
        setValidationError('');
    };

    const handleSubmitRepository = async () => {
        if (!isValidGitHubUrl(githubUrl)) {
            setValidationError('Please enter a valid GitHub repository URL');
            return;
        }

        try {
            setIsValidating(true);
            const repoPath = githubUrl.replace('https://github.com/', '');
            const response = await fetch(`https://api.github.com/repos/${repoPath}`);

            if (!response.ok) throw new Error('Repository not found');

            // If valid, navigate to project details
            navigate(`/student/projects/${selectedProject._id}`, {
                state: {
                    githubUrl,
                    project: selectedProject
                }
            });
        } catch (error) {
            setValidationError('Repository not found or not accessible');
        } finally {
            setIsValidating(false);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={60} sx={{ color: '#dd2825' }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto' }}>
                    Error loading projects: {error.message}
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{
                mb: 4,
                color: '#dd2825',
                fontWeight: 600,
                textAlign: 'center'
            }}>
                Team Projects
            </Typography>

            {/* GitHub Repository Dialog */}
            <Dialog open={!!selectedProject} onClose={() => setSelectedProject(null)}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <GitHub fontSize="large" />
                    <span>Add GitHub Repository</span>
                </DialogTitle>
                <DialogContent sx={{ pt: 3, minWidth: 400 }}>
                    <Typography variant="body1" gutterBottom>
                        To work on {selectedProject?.name}, please provide your teams GitHub repository:
                    </Typography>

                    <TextField
                        fullWidth
                        variant="outlined"
                        label="GitHub Repository URL"
                        placeholder="https://github.com/username/repository"
                        value={githubUrl}
                        onChange={(e) => {
                            setGithubUrl(e.target.value);
                            setValidationError('');
                        }}
                        error={!!validationError}
                        helperText={validationError || " "}
                        sx={{ mb: 2 }}
                        disabled={isValidating}
                    />

                    <Typography variant="body2" color="text.secondary">
                        This repository will be used for all project submissions and collaboration
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedProject(null)} disabled={isValidating}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmitRepository}
                        disabled={isValidating}
                        startIcon={isValidating ? <CircularProgress size={20} /> : null}
                        sx={{
                            backgroundColor: '#dd2825',
                            '&:hover': { backgroundColor: '#c42020' }
                        }}
                    >
                        {isValidating ? 'Verifying...' : 'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>

            {projects.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
                    <Typography variant="h6" gutterBottom>
                        No Projects Assigned
                    </Typography>
                    <Typography color="text.secondary">
                        You have not been assigned to any team projects yet.
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {projects.map((project) => (
                        <Grid item xs={12} md={6} lg={4} key={project._id}>
                            <Card sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: 3
                                }
                            }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6" component="div">
                                            {project.name}
                                        </Typography>
                                        <Chip
                                            label={project.status}
                                            color={
                                                project.status === 'COMPLETED' ? 'success' :
                                                    project.status === 'IN_PROGRESS' ? 'warning' : 'info'
                                            }
                                            size="small"
                                        />
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        {project.description}
                                    </Typography>

                                    <Divider sx={{ my: 2 }} />

                                    <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Chip
                                            icon={<CalendarToday />}
                                            label={`Start: ${new Date(project.startDate).toLocaleDateString()}`}
                                            size="small"
                                            variant="outlined"
                                        />
                                        <Chip
                                            icon={<CalendarToday />}
                                            label={`End: ${new Date(project.endDate).toLocaleDateString()}`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>
                                </CardContent>

                                <CardActions sx={{ borderTop: 1, borderColor: 'divider' }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<Code />}
                                        onClick={() => handleAddRepository(project)}
                                        sx={{
                                            backgroundColor: '#dd2825',
                                            '&:hover': { backgroundColor: '#c42020' }
                                        }}
                                    >
                                        Add GitHub Repository
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default TeamProjects;