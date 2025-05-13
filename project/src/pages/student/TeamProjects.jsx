import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tooltip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Avatar,
    Snackbar
} from '@mui/material';
import {
    Code,
    GitHub,
    CalendarToday,
    ExpandMore,
    History as Commit,
    AccountTree as BranchIcon,
    Person,
    TaskAlt,
    Error as ErrorIcon
} from '@mui/icons-material';
import { api } from '../../api/axiosConfig';

const TeamProjects = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedProject, setSelectedProject] = useState(null);
    const [githubUrl, setGithubUrl] = useState('');
    const [validationError, setValidationError] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [repoDetails, setRepoDetails] = useState(null);
    const [showRepoDetails, setShowRepoDetails] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const { data: projects = [], isLoading, error } = useQuery({
        queryKey: ['teamProjects'],
        queryFn: async () => {
            const response = await api.get('/assignments/team-projects');
            console.log('API Response:', response.data);
            return response.data.map(project => ({
                ...project,
                githubRepository: project.githubRepository || null,
                repositoryDetails: project.repositoryDetails || null
            }));
        },
        staleTime: 300000
    });

    const linkRepositoryMutation = useMutation({
        mutationFn: async (data) => {
            const response = await api.post(`/assignments/team-projects/${data.projectId}/repository`, {
                repositoryUrl: data.githubUrl,
                repositoryDetails: data.repoDetails
            });
            return response.data;
        },
        onSuccess: (data) => {
            // Update the specific project in cache
            queryClient.setQueryData(['teamProjects'], (old) =>
                old.map(project =>
                    project._id === data.project._id
                        ? { ...project, ...data.project }
                        : project
                )
            );
            setSuccessMessage('Repository linked successfully!');
            setSelectedProject(null);
            setRepoDetails(null);
            setGithubUrl('');
            setShowRepoDetails(false);
        },
        onError: (error) => {
            console.error('Mutation error:', error);
            setValidationError(error.message || 'Failed to link repository');
        }
    });

    const isValidGitHubUrl = (url) => {
        const pattern = /^https?:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;
        return pattern.test(url);
    };

    const handleAddRepository = (project) => {
        setSelectedProject(project);
        setGithubUrl(project.githubRepository || '');
        setValidationError('');
        setRepoDetails(null);
        setShowRepoDetails(false);
    };

    const extractRepoInfo = (url) => {
        if (!url) return null;
        const parts = url.replace('https://github.com/', '').split('/');
        if (parts.length >= 2) {
            return { owner: parts[0], repo: parts[1] };
        }
        return null;
    };

    const fetchRepositoryDetails = async () => {
        if (!isValidGitHubUrl(githubUrl)) {
            setValidationError('Please enter a valid GitHub repository URL');
            return null;
        }

        try {
            setIsValidating(true);
            const repoInfo = extractRepoInfo(githubUrl);
            if (!repoInfo) {
                setValidationError('Invalid repository URL format');
                return null;
            }

            // Optional: Add GitHub token for higher rate limits
            const headers = {
                Accept: 'application/vnd.github.v3+json'
                // Authorization: `Bearer YOUR_GITHUB_TOKEN` // Uncomment and add token if needed
            };

            const repoResponse = await fetch(
                `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`,
                { headers }
            );

            if (!repoResponse.ok) {
                throw new Error('Repository not found or not accessible');
            }

            const repoData = await repoResponse.json();

            const contributorsResponse = await fetch(
                `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contributors`,
                { headers }
            );
            const contributorsData = contributorsResponse.ok
                ? await contributorsResponse.json()
                : [];

            const commitsResponse = await fetch(
                `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/commits?per_page=5`,
                { headers }
            );
            const commitsData = commitsResponse.ok
                ? await commitsResponse.json()
                : [];

            const branchesResponse = await fetch(
                `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/branches`,
                { headers }
            );
            const branchesData = branchesResponse.ok
                ? await branchesResponse.json()
                : [];

            const repositoryDetails = {
                name: repoData.name,
                fullName: repoData.full_name,
                description: repoData.description,
                stars: repoData.stargazers_count,
                forks: repoData.forks_count,
                openIssues: repoData.open_issues_count,
                createdAt: repoData.created_at,
                updatedAt: repoData.updated_at,
                language: repoData.language,
                owner: {
                    login: repoData.owner.login,
                    avatarUrl: repoData.owner.avatar_url
                },
                contributors: contributorsData.slice(0, 10).map(c => ({
                    login: c.login,
                    avatarUrl: c.avatar_url,
                    contributions: c.contributions
                })),
                recentCommits: commitsData.map(c => ({
                    sha: c.sha,
                    message: c.commit.message,
                    author: c.commit.author.name,
                    date: c.commit.author.date,
                    avatarUrl: c.author?.avatar_url
                })),
                branches: branchesData.map(b => b.name)
            };

            setRepoDetails(repositoryDetails);
            setShowRepoDetails(true);
            setValidationError('');
            return repositoryDetails;
        } catch (error) {
            console.error('GitHub API error:', error); // Debug log
            setValidationError(error.message || 'Failed to fetch repository details');
            return null;
        } finally {
            setIsValidating(false);
        }
    };

    const handleSubmitRepository = () => {
        if (!repoDetails) {
            setValidationError('Please verify the repository first');
            return;
        }

        linkRepositoryMutation.mutate({
            projectId: selectedProject._id,
            githubUrl,
            repoDetails
        });
    };

    const handleViewProject = (project) => {
        navigate(`/student/projectgithub/${project._id}`);
    };

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

            {/* Success Snackbar */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={6000}
                onClose={() => setSuccessMessage('')}
                message={successMessage}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSuccessMessage('')}>
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* GitHub Repository Dialog */}
            <Dialog
                open={!!selectedProject}
                onClose={() => setSelectedProject(null)}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <GitHub fontSize="large" />
                    <span>Link GitHub Repository</span>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography variant="body1" gutterBottom>
                        To work on {selectedProject?.name}, please provide your team's GitHub repository:
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            label="GitHub Repository URL"
                            placeholder="https://github.com/username/repository"
                            value={githubUrl}
                            onChange={(e) => {
                                setGithubUrl(e.target.value);
                                setValidationError('');
                                setRepoDetails(null);
                                setShowRepoDetails(false);
                            }}
                            error={!!validationError}
                            helperText={validationError || " "}
                            disabled={isValidating || linkRepositoryMutation.isLoading}
                        />
                        <Button
                            variant="contained"
                            onClick={fetchRepositoryDetails}
                            disabled={isValidating || !githubUrl || linkRepositoryMutation.isLoading}
                            sx={{
                                backgroundColor: '#dd2825',
                                color: 'white',
                                '&:hover': { backgroundColor: '#c42020' }
                            }}
                        >
                            {isValidating ?
                                <CircularProgress size={24} sx={{ color: 'white' }} /> :
                                'Verify'
                            }
                        </Button>
                    </Box>

                    {/* Repository Details Preview */}
                    {showRepoDetails && repoDetails && (
                        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6">
                                    {repoDetails.name}
                                </Typography>
                                <Chip
                                    icon={<TaskAlt />}
                                    label="Repository Verified"
                                    color="success"
                                    size="small"
                                />
                            </Box>

                            <Typography variant="body2" color="text.secondary" paragraph>
                                {repoDetails.description || 'No description available'}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                                <Chip
                                    label={`Language: ${repoDetails.language || 'Unknown'}`}
                                    size="small"
                                    variant="outlined"
                                />
                                <Chip
                                    label={`Stars: ${repoDetails.stars}`}
                                    size="small"
                                    variant="outlined"
                                />
                                <Chip
                                    label={`Forks: ${repoDetails.forks}`}
                                    size="small"
                                    variant="outlined"
                                />
                                <Chip
                                    label={`Open Issues: ${repoDetails.openIssues}`}
                                    size="small"
                                    variant="outlined"
                                />
                            </Box>

                            <Accordion disableGutters>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="subtitle2">
                                        Repository Details
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        {/* Contributors */}
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                                                <Person sx={{ mr: 1, fontSize: 20 }} />
                                                Contributors
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {repoDetails.contributors.length > 0 ? (
                                                    repoDetails.contributors.map((contributor, idx) => (
                                                        <Tooltip key={idx} title={`${contributor.login}: ${contributor.contributions} commits`}>
                                                            <Avatar
                                                                src={contributor.avatarUrl}
                                                                alt={contributor.login}
                                                                sx={{ width: 32, height: 32 }}
                                                            />
                                                        </Tooltip>
                                                    ))
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        No contributors information available
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Grid>

                                        {/* Branches */}
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                                                <BranchIcon sx={{ mr: 1, fontSize: 20 }} />
                                                Branches
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {repoDetails.branches.length > 0 ? (
                                                    repoDetails.branches.map((branch, idx) => (
                                                        <Chip
                                                            key={idx}
                                                            label={branch}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    ))
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        No branch information available
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Grid>

                                        {/* Recent Commits */}
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                                                <Commit sx={{ mr: 1, fontSize: 20 }} />
                                                Recent Commits
                                            </Typography>
                                            {repoDetails.recentCommits.length > 0 ? (
                                                <List dense disablePadding>
                                                    {repoDetails.recentCommits.map((commit, idx) => (
                                                        <ListItem key={idx} sx={{ py: 0.5 }}>
                                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                                <Avatar
                                                                    src={commit.avatarUrl}
                                                                    alt={commit.author}
                                                                    sx={{ width: 24, height: 24 }}
                                                                />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={commit.message.split('\n')[0]}
                                                                secondary={`${commit.author} · ${new Date(commit.date).toLocaleDateString()}`}
                                                                primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                                                                secondaryTypographyProps={{ variant: 'caption' }}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    No commit history available
                                                </Typography>
                                            )}
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        </Paper>
                    )}

                    <Typography variant="body2" color="text.secondary">
                        This repository will be used for all project submissions, code reviews, and team collaboration.
                        Our platform will track commits, pull requests, and issues to monitor project progress.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setSelectedProject(null)}
                        disabled={isValidating || linkRepositoryMutation.isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmitRepository}
                        disabled={isValidating || !repoDetails || linkRepositoryMutation.isLoading}
                        startIcon={linkRepositoryMutation.isLoading ? <CircularProgress size={20} /> : null}
                        sx={{
                            backgroundColor: '#dd2825',
                            '&:hover': { backgroundColor: '#c42020' }
                        }}
                    >
                        {linkRepositoryMutation.isLoading ? 'Linking...' : 'Link Repository'}
                    </Button>
                </DialogActions>
            </Dialog>

            {linkRepositoryMutation.isError && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    onClose={() => linkRepositoryMutation.reset()}
                >
                    Failed to link repository: {linkRepositoryMutation.error.message}
                </Alert>
            )}

            {isLoading ? (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Failed to load projects: {error.message}
                </Alert>
            ) : projects.length === 0 ? (
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

                                    {project.githubRepository && (
                                        <Box sx={{ mb: 2 }}>
                                            <Chip
                                                icon={<GitHub />}
                                                label="Repository Linked"
                                                color="success"
                                                size="small"
                                                sx={{ mb: 1 }}
                                            />
                                            <Typography
                                                variant="caption"
                                                component="div"
                                                sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {project.githubRepository}
                                            </Typography>
                                        </Box>
                                    )}

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

                                <CardActions sx={{ borderTop: 1, borderColor: 'divider', flexWrap: 'wrap', p: 1.5 }}>
                                    {project.githubRepository ? (
                                        <>
                                            <Button
                                                variant="contained"
                                                startIcon={<GitHub />}
                                                onClick={() => window.open(project.githubRepository, '_blank')}
                                                sx={{
                                                    backgroundColor: '#dd2825',
                                                    color: 'white',
                                                    '&:hover': { backgroundColor: '#dd2825' },
                                                    flex: '1 1 0',
                                                    mr: 1
                                                }}
                                            >
                                                View Repo
                                            </Button>
                                            <Button
                                                variant="contained"
                                                startIcon={<Code />}
                                                onClick={() => handleViewProject(project)}
                                                sx={{
                                                    backgroundColor: '#dd2825',
                                                    color: 'white',
                                                    '&:hover': { backgroundColor: '#c42020' },
                                                    flex: '1 1 0'
                                                }}
                                            >
                                                View Project
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            startIcon={<GitHub />}
                                            onClick={() => handleAddRepository(project)}
                                            sx={{
                                                backgroundColor: '#dd2825',
                                                color: 'white',
                                                '&:hover': { backgroundColor: '#c42020' }
                                            }}
                                        >
                                            Link GitHub Repository
                                        </Button>
                                    )}
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