import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Chip,
    Button,
    Avatar,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    LinearProgress,
    Tab,
    Tabs,
    Link
} from '@mui/material';
import {
    GitHub,
    Code,
    CalendarToday,
    Person,
    Group,
    TaskAlt,
    ArrowBack,
    Build,
    Assignment,
    Timeline,
    AccountTree as BranchIcon,
    History as Commit,
} from '@mui/icons-material';
import { api } from '../../api/axiosConfig';

const ProjectDetailView = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [error, setError] = useState(null);

    // Move all hooks to the top level and don't conditionally return before them
    const {
        data: project,
        isLoading,
        error: fetchError,
        refetch
    } = useQuery({
        queryKey: ['projectDetails', projectId],
        queryFn: async () => {
            try {
                const response = await api.get(`/assignments/team-projects/${projectId}`);

                if (!response.data.githubRepository && response.data.repositoryDetails) {
                    return {
                        ...response.data,
                        githubRepository: 'https://github.com/placeholder/repo'
                    };
                }

                return response.data;
            } catch (error) {
                if (error.response?.status === 400) {
                    navigate('/student/team-projects', { replace: true });
                }
                throw error;
            }
        },
        retry: 2,
        staleTime: 1000 * 60 * 5
    });

    // Keep useEffect after other hooks
    useEffect(() => {
        if (projectId) {
            refetch();
        }
    }, [projectId, refetch]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleGoBack = () => {
        navigate('/student/team-projects');
    };

    // Render methods
    const renderRepositoryTab = () => {
        if (!project) return null;

        return (
            <Box sx={{ p: 3 }}>
                {project?.githubRepository ? (
                    project?.repositoryDetails ? (
                        <Grid container spacing={3}>
                            {/* Repository Info */}
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Repository Info
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2">Name:</Typography>
                                            <Typography variant="body2">
                                                {project.repositoryDetails?.name || "Not available"}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2">Description:</Typography>
                                            <Typography variant="body2">
                                                {project.repositoryDetails?.description || 'No description available'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2">Owner:</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar
                                                    src={project.repositoryDetails?.owner?.avatarUrl}
                                                    sx={{ width: 24, height: 24 }}
                                                />
                                                <Typography variant="body2">
                                                    {project.repositoryDetails?.owner?.login || "Unknown"}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                            <Chip
                                                label={`Language: ${project.repositoryDetails?.language || 'Unknown'}`}
                                                size="small"
                                                variant="outlined"
                                            />
                                            <Chip
                                                label={`Stars: ${project.repositoryDetails?.stars || 0}`}
                                                size="small"
                                                variant="outlined"
                                            />
                                            <Chip
                                                label={`Forks: ${project.repositoryDetails?.forks || 0}`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>

                                        <Box sx={{ mt: 3 }}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                href={project.githubRepository}
                                                target="_blank"
                                                startIcon={<GitHub />}
                                                sx={{
                                                    backgroundColor: '#dd2825',
                                                    color: 'white',
                                                    '&:hover': { backgroundColor: '#c42020' },
                                                }}
                                            >
                                                View on GitHub
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Contributors */}
                            <Grid item xs={12} md={4}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Person fontSize="small" />
                                            Contributors
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />

                                        {project.repositoryDetails?.contributors?.length > 0 ? (
                                            <List disablePadding>
                                                {project.repositoryDetails.contributors.map((contributor, idx) => (
                                                    <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                                            <Avatar
                                                                src={contributor.avatarUrl}
                                                                alt={contributor.login}
                                                                sx={{ width: 32, height: 32 }}
                                                            />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={contributor.login}
                                                            secondary={`${contributor.contributions} contributions`}
                                                            primaryTypographyProps={{ variant: 'body2' }}
                                                            secondaryTypographyProps={{ variant: 'caption' }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No contributors information available
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Branches */}
                            <Grid item xs={12} md={4}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <BranchIcon fontSize="small" />
                                            Branches
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />

                                        {project.repositoryDetails?.branches?.length > 0 ? (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {project.repositoryDetails.branches.map((branch, idx) => (
                                                    <Chip
                                                        key={idx}
                                                        label={branch}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No branch information available
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Recent Commits */}
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Commit fontSize="small" />
                                            Recent Commits
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />

                                        {project.repositoryDetails?.recentCommits?.length > 0 ? (
                                            <List>
                                                {project.repositoryDetails.recentCommits.map((commit, idx) => (
                                                    <ListItem key={idx} sx={{ py: 1 }}>
                                                        <ListItemIcon>
                                                            <Avatar src={commit.avatarUrl} alt={commit.author} />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={commit.message?.split('\n')[0]}
                                                            secondary={`${commit.author} · ${new Date(commit.date).toLocaleDateString()}`}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No commit history available
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Repository linked but no details available
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => refetch()}
                                sx={{ mr: 2, mt: 2 }}
                            >
                                Refresh Data
                            </Button>
                            <Button
                                variant="contained"
                                href={project.githubRepository}
                                target="_blank"
                                startIcon={<GitHub />}
                                sx={{
                                    mt: 2,
                                    backgroundColor: '#333',
                                    '&:hover': { backgroundColor: '#555' }
                                }}
                            >
                                View on GitHub
                            </Button>
                        </Box>
                    )
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            No GitHub Repository Linked
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                            This project doesn't have a GitHub repository linked yet.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/student/projects')}
                            startIcon={<GitHub />}
                            sx={{
                                backgroundColor: '#dd2825',
                                '&:hover': { backgroundColor: '#c42020' }
                            }}
                        >
                            Link GitHub Repository
                        </Button>
                    </Box>
                )}
            </Box>
        );
    };

    // Main render
    // Handle error and loading states outside of the query hook
    if (isLoading) {
        return (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading project details...</Typography>
            </Box>
        );
    }

    // Handle fetchError separately here
    if (fetchError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    Error loading project: {fetchError.message}
                </Alert>
                <Button
                    variant="contained"
                    onClick={() => navigate('/student/team-projects')}
                >
                    Back to Projects List
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Button startIcon={<ArrowBack />} onClick={handleGoBack} sx={{ mb: 2 }}>
                Back to Projects
            </Button>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                    <Button
                        size="small"
                        sx={{ ml: 2 }}
                        onClick={() => {
                            setError(null);
                            refetch();
                        }}
                    >
                        Retry
                    </Button>
                </Alert>
            )}

            {/* Project Header */}
            {project && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography variant="h4" sx={{ color: '#dd2825', fontWeight: 600 }}>
                                {project?.name || "Project"}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                                {project?.description || "No description available"}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                            {project?.status && (
                                <Chip
                                    label={project.status}
                                    color={
                                        project.status === 'COMPLETED' ? 'success' :
                                            project.status === 'IN_PROGRESS' ? 'warning' : 'info'
                                    }
                                />
                            )}
                            {project?.progressPercentage !== undefined && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', mt: 1 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={project.progressPercentage}
                                        sx={{ flex: 1, height: 10, borderRadius: 5 }}
                                    />
                                    <Typography variant="body2" sx={{ minWidth: '45px' }}>
                                        {project.progressPercentage}%
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                        {project?.startDate && (
                            <Chip
                                icon={<CalendarToday />}
                                label={`Start: ${new Date(project.startDate).toLocaleDateString()}`}
                                variant="outlined"
                            />
                        )}
                        {project?.endDate && (
                            <Chip
                                icon={<CalendarToday />}
                                label={`End: ${new Date(project.endDate).toLocaleDateString()}`}
                                variant="outlined"
                            />
                        )}
                        {project?.members?.length > 0 && (
                            <Chip
                                icon={<Group />}
                                label={`Team: ${project.members.length} members`}
                                variant="outlined"
                            />
                        )}
                        {project?.githubRepository && (
                            <Chip
                                icon={<GitHub />}
                                label="Repository Linked"
                                color="success"
                            />
                        )}
                    </Box>

                    {project?.githubRepository && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <GitHub fontSize="small" />
                                Repository URL:
                            </Typography>
                            <Link
                                href={project.githubRepository}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ wordBreak: 'break-all' }}
                            >
                                {project.githubRepository}
                            </Link>
                        </Box>
                    )}

                    {/* Retry button in case of problems */}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            size="small"
                            startIcon={<Commit />}
                            onClick={() => refetch()}
                        >
                            Refresh Data
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Main Content with Tabs */}
            {project && (
                <Paper sx={{ mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab icon={<Code />} label="Repository" />
                        <Tab icon={<Assignment />} label="Tasks" />
                        <Tab icon={<Group />} label="Team" />
                        <Tab icon={<Timeline />} label="Progress" />
                    </Tabs>

                    {/* Repository Tab */}
                    {activeTab === 0 && renderRepositoryTab()}

                    {/* Tasks Tab */}
                    {activeTab === 1 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                Task management interface will be displayed here.
                            </Typography>
                        </Box>
                    )}

                    {/* Team Tab */}
                    {activeTab === 2 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                Team members and collaboration features will be displayed here.
                            </Typography>
                        </Box>
                    )}

                    {/* Progress Tab */}
                    {activeTab === 3 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                Project progress tracking and timeline will be displayed here.
                            </Typography>
                        </Box>
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default ProjectDetailView;