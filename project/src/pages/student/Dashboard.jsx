// project/src/pages/student/StudentDashboard.jsx
import { Box, Typography, Paper, Grid, List, ListItem, ListItemText, Chip, Tooltip, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../../api/userApi';
import { fetchAllProjects, fetchProjectInsights } from '../../api/projectApi'; // Import fetchAllProjects

const StudentDashboard = () => {
    // Fetch current user data
    const { data: user, isLoading: userLoading, error: userError } = useQuery({
        queryKey: ['currentUser'],
        queryFn: getCurrentUser,
    });

    // Fetch projects for the student (based on class AND team membership)
    const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useQuery({
        queryKey: ['projects', user?.classe?._id, user?._id], // Include user._id to refetch if user changes
        queryFn: () => fetchAllProjects('STUDENT'), // Use fetchAllProjects instead of fetchProjectsForClass
        enabled: !!user?._id, // Wait for user to be loaded
    });

    if (userLoading) {
        return (
            <Box sx={{ flexGrow: 1, p: 3 }}>
                <Typography variant="h4" sx={{ mb: 4, color: '#dd2825', fontWeight: 'bold' }}>
                    Student Dashboard
                </Typography>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    if (userError) {
        return (
            <Box sx={{ flexGrow: 1, p: 3 }}>
                <Typography variant="h4" sx={{ mb: 4, color: '#dd2825', fontWeight: 'bold' }}>
                    Student Dashboard
                </Typography>
                <Typography color="error">Error loading profile: {userError.message}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h4" sx={{ mb: 4, color: '#dd2825', fontWeight: 'bold' }}>
                Student Dashboard
            </Typography>

            <Grid container spacing={3}>
                {/* Welcome Section */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 3, height: '100%', borderRadius: 2, bgcolor: 'white', border: '1px solid #eaeaea' }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#dd2825' }}>
                            Welcome to your Student Portal
                        </Typography>
                        <Typography variant="body1">
                            Here you can manage your projects, tasks, and view your progress.
                        </Typography>
                    </Paper>
                </Grid>

                {/* Profile Section */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 3, height: '100%', borderRadius: 2, bgcolor: 'white', border: '1px solid #eaeaea' }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#dd2825' }}>
                            Your Profile
                        </Typography>
                        {user ? (
                            <Box>
                                <Typography variant="body1"><strong>Name:</strong> {user.firstName} {user.lastName}</Typography>
                                <Typography variant="body1"><strong>Email:</strong> {user.email}</Typography>
                                <Typography variant="body1"><strong>Role:</strong> {user.userRole}</Typography>
                                <Typography variant="body1"><strong>Class:</strong> {user.classe ? user.classe.name : 'Not assigned'}</Typography>
                            </Box>
                        ) : (
                            <Typography>No user data available</Typography>
                        )}
                    </Paper>
                </Grid>

                {/* Projects Section */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, bgcolor: 'white', border: '1px solid #eaeaea' }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#dd2825' }}>
                            My Projects
                        </Typography>
                        {projectsLoading ? (
                            <Typography>Loading projects...</Typography>
                        ) : projectsError ? (
                            <Typography color="error">Error: {projectsError.message}</Typography>
                        ) : projects.length === 0 ? (
                            <Typography>You haven’t been assigned to any projects yet.</Typography>
                        ) : (
                            <List>
                                {projects.map((project) => (
                                    <ProjectInsightItem key={project._id} project={project} />
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

// Component to display project insights
// project/src/pages/student/StudentDashboard.jsx
const ProjectInsightItem = ({ project }) => {
    const { data: insights, isLoading: insightsLoading, error: insightsError } = useQuery({
        queryKey: ['projectInsights', project._id],
        queryFn: () => fetchProjectInsights(project._id),
    });

    return (
        <ListItem>
            <ListItemText
                primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{project.name}</Typography>
                        <Chip
                            label={project.status}
                            size="small"
                            color={
                                project.status === 'COMPLETED'
                                    ? 'success'
                                    : project.status === 'IN_PROGRESS'
                                        ? 'primary'
                                        : project.status === 'PENDING'
                                            ? 'warning'
                                            : 'default'
                            }
                        />
                    </Box>
                }
                secondary={
                    <>
                        <Typography variant="body2" color="textSecondary">
                            {project.description || 'No description available'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Progress: {project.progressPercentage}%
                        </Typography>
                        {project.startDate && (
                            <Typography variant="body2" color="textSecondary">
                                Start Date: {new Date(project.startDate).toLocaleDateString()}
                            </Typography>
                        )}
                        {project.endDate && (
                            <Typography variant="body2" color="textSecondary">
                                End Date: {new Date(project.endDate).toLocaleDateString()}
                            </Typography>
                        )}
                        {insightsLoading ? (
                            <Typography variant="body2" color="textSecondary">
                                Loading insights...
                            </Typography>
                        ) : insightsError ? (
                            <Typography variant="body2" color="error">
                                Error loading insights: {insightsError.message}
                            </Typography>
                        ) : (
                            <>
                                {insights?.predictedCompletion?.predictedCompletionDate ? (
                                    <Tooltip title="This is an AI-predicted estimate based on your progress history.">
                                        <Typography variant="body2" color="textSecondary">
                                            Predicted Completion: {new Date(insights.predictedCompletion.predictedCompletionDate).toLocaleDateString()}
                                        </Typography>
                                    </Tooltip>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        No predicted completion date available
                                        {insights?.predictedCompletion?.message ? ` (${insights.predictedCompletion.message})` : ''}
                                    </Typography>
                                )}
                                {insights?.riskAlert?.alert && (
                                    <Alert severity="warning" sx={{ mt: 1 }}>
                                        {insights.riskAlert.alert}
                                    </Alert>
                                )}
                            </>
                        )}
                    </>
                }
            />
        </ListItem>
    );
};
export default StudentDashboard;
