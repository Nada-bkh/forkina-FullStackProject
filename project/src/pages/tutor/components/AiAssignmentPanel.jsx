import { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TextField,
    MenuItem,
    Snackbar
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/axiosConfig.js';

const AiAssignmentPanel = () => {
    const [assignments, setAssignments] = useState([]);
    const [applications, setApplications] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loadingApplications, setLoadingApplications] = useState(true);
    const [finalTeam, setFinalTeam] = useState('');
    const [finalProject, setFinalProject] = useState('');
    const [projects, setProjects] = useState([]);
    const queryClient = useQueryClient();

    // Mutation for AI assignment
    const { mutate: runAssignment, isPending: isAssignmentPending } = useMutation({
        mutationFn: async () => {
            const response = await api.post('/assignments/assign');
            return response.data;
        },
        onSuccess: (data) => {
            setAssignments(data);
            setError(null);
        },
        onError: (error) => {
            setError(error.response?.data?.message || 'Failed to run AI assignment');
            setAssignments([]);
        }
    });

    // Mutation for submitting final assignment
    const { mutate: submitFinalAssignment, isPending: isSubmitting } = useMutation({
        mutationFn: async () => {
            const response = await api.post('/assignments/submit-final', {
                teamName: finalTeam,
                projectName: finalProject
            });
            return response.data;
        },
        onSuccess: (data) => {
            setSuccess('Final assignment submitted successfully');
            setError(null);
            setFinalTeam('');
            setFinalProject('');
            // Refresh applications data
            fetchApplications();
            // Clear the success message after 5 seconds
            setTimeout(() => setSuccess(null), 5000);
        },
        onError: (error) => {
            setError(error.response?.data?.message || 'Failed to submit final assignment');
        }
    });

    const fetchApplications = async () => {
        try {
            const response = await api.get('/project-applications/tutor/applications');
            setApplications(response.data);
            setLoadingApplications(false);

            // Extract unique projects from applications
            const uniqueProjects = [];
            const projectIds = new Set();

            response.data.forEach(app => {
                if (app.projectRef && !projectIds.has(app.projectRef._id)) {
                    projectIds.add(app.projectRef._id);
                    uniqueProjects.push(app.projectRef);
                }
            });

            setProjects(uniqueProjects);
        } catch (err) {
            setError('Failed to fetch applications');
            setLoadingApplications(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleManualSubmit = () => {
        if (!finalTeam || !finalProject) {
            setError('Please select both a team and a project');
            return;
        }
        submitFinalAssignment();
    };

    const handleApplyAIRecommendation = (teamName, projectName) => {
        setFinalTeam(teamName);
        setFinalProject(projectName);
    };

    return (
        <Box sx={{ p: 3 }}>
            {success && (
                <Snackbar
                    open={!!success}
                    autoHideDuration={5000}
                    onClose={() => setSuccess(null)}
                >
                    <Alert severity="success" onClose={() => setSuccess(null)}>
                        {success}
                    </Alert>
                </Snackbar>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h5" sx={{ color: '#1976d2', mb: 2 }}>
                            Submit Final Team Assignment
                        </Typography>

                        <TextField
                            fullWidth
                            select
                            label="Select Team"
                            value={finalTeam}
                            onChange={(e) => setFinalTeam(e.target.value)}
                            sx={{ mb: 2 }}
                        >
                            {/* Get unique team names */}
                            {Array.from(new Set(applications.map(app => app.teamName)))
                                .map((teamName) => (
                                    <MenuItem key={teamName} value={teamName}>
                                        {teamName}
                                    </MenuItem>
                                ))}
                        </TextField>

                        <TextField
                            fullWidth
                            select
                            label="Select Project"
                            value={finalProject}
                            onChange={(e) => setFinalProject(e.target.value)}
                            sx={{ mb: 2 }}
                        >
                            {projects.map((project) => (
                                <MenuItem key={project._id} value={project.name}>
                                    {project.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleManualSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Final Assignment'
                            )}
                        </Button>
                    </Paper>

                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Submitted Project Applications
                    </Typography>

                    {loadingApplications ? (
                        <CircularProgress />
                    ) : applications.length > 0 ? (
                        <Paper sx={{ p: 3 }}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Team Name</TableCell>
                                            <TableCell>Project</TableCell>
                                            <TableCell>Motivational Letter</TableCell>
                                            <TableCell>Priority</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {applications.map((app) => (
                                            <TableRow key={app._id}>
                                                <TableCell>{app.teamName}</TableCell>
                                                <TableCell>{app.projectRef?.name || 'Unknown'}</TableCell>
                                                <TableCell>{app.motivationLetter || 'N/A'}</TableCell>
                                                <TableCell>{app.priority}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={app.status}
                                                        color={
                                                            app.status === 'ACCEPTED' ? 'success' :
                                                                app.status === 'REJECTED' ? 'error' : 'default'
                                                        }
                                                        size="small"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    ) : (
                        <Alert severity="info">No applications submitted.</Alert>
                    )}
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#dd2825' }}>
                            AI-Powered Assignment
                        </Typography>

                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{
                                backgroundColor: '#dd2825',
                                '&:hover': { backgroundColor: '#c42020' },
                                mb: 2
                            }}
                            onClick={() => runAssignment()}
                            disabled={isAssignmentPending}
                        >
                            {isAssignmentPending ? (
                                <>
                                    <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
                                    Processing...
                                </>
                            ) : (
                                'Run AI Assignment'
                            )}
                        </Button>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {assignments.length > 0 && (
                            <>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    AI Recommendations:
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Team</TableCell>
                                                <TableCell>Project</TableCell>
                                                <TableCell>Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {assignments.map((a) => (
                                                <TableRow key={a._id || a.teamName}>
                                                    <TableCell>{a.teamName}</TableCell>
                                                    <TableCell>{a.assignedProject || '—'}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="primary"
                                                            onClick={() => handleApplyAIRecommendation(a.teamName, a.assignedProject)}
                                                            disabled={!!a.error}
                                                        >
                                                            Apply
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AiAssignmentPanel;