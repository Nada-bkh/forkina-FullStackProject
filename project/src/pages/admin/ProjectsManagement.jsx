import { useState, useEffect } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, TextField, Alert, Tabs, Tab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ProjectsList from '../student/ProjectsList';
import AdminProjectCreate from './AdminProjectCreate';
import AdminProjectEdit from './AdminProjectEdit';
import { fetchClasses } from '../../api/classApi';
import { assignClassesToProject, fetchAllProjects, assignTeamToProject, deleteProject, approveProject, rejectProject } from '../../api/projectApi';
import { fetchAllTeams } from '../../api/teamApi';
import RefreshIcon from '@mui/icons-material/Refresh';

const ProjectsManagement = () => {
    // State variables
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editProjectId, setEditProjectId] = useState(null);
    const [assignClassesModal, setAssignClassesModal] = useState(false);
    const [assignTeamsModal, setAssignTeamsModal] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [classes, setClasses] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [teams, setTeams] = useState([]);
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [projects, setProjects] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [filteredProjects, setFilteredProjects] = useState([]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        filterProjects(newValue);
    };

    // Filter projects based on tab value
    const filterProjects = (tabIndex) => {
        switch (tabIndex) {
            case 0: // All
                setFilteredProjects(projects);
                break;
            case 1: // Recommended
                setFilteredProjects(projects.filter(p => p.approvalStatus === 'RECOMMENDED'));
                break;
            case 2: // Approved
                setFilteredProjects(projects.filter(p => p.approvalStatus === 'APPROVED'));
                break;
            case 3: // Rejected
                setFilteredProjects(projects.filter(p => p.approvalStatus === 'REJECTED'));
                break;
            default:
                setFilteredProjects(projects);
        }
    };

    // Approve a project
    const handleApproveProject = async (projectId) => {
        try {
            await approveProject(projectId);
            await loadProjects();
            setSuccess('Project approved successfully');
        } catch (error) {
            setError(error.message || 'Failed to approve project');
        } finally {
            setTimeout(() => {
                setSuccess('');
                setError('');
            }, 3000);
        }
    };

    // Reject a project
    const handleRejectProject = async (projectId) => {
        try {
            await rejectProject(projectId);
            await loadProjects();
            setSuccess('Project rejected successfully');
        } catch (error) {
            setError(error.message || 'Failed to reject project');
        } finally {
            setTimeout(() => {
                setSuccess('');
                setError('');
            }, 3000);
        }
    };

    // Delete project handler
    const handleDelete = async (projectId) => {
        try {
            await deleteProject(projectId);
            await loadProjects();
            setSuccess('Project deleted successfully');
        } catch (error) {
            setError(error.message || 'Failed to delete project');
        } finally {
            setTimeout(() => {
                setSuccess('');
                setError('');
            }, 3000);
        }
    };

    // Load projects
    const loadProjects = async () => {
        try {
            const projectData = await fetchAllProjects('ADMIN');
            console.log('Fetched projects:', projectData);
            const validProjects = projectData.filter(project => {
                const isValidId = project._id && /^[0-9a-fA-F]{24}$/.test(project._id);
                if (!isValidId) {
                    console.warn('Invalid project ID, filtering out:', project);
                }
                return isValidId;
            });
            setProjects(validProjects);
            filterProjects(tabValue);
        } catch (err) {
            setError(err.message || 'Failed to load projects');
        }
    };

    // Load teams
    const loadTeams = async () => {
        try {
            const teamData = await fetchAllTeams();
            setTeams(teamData);
        } catch (err) {
            setError(err.message || 'Failed to load teams');
        }
    };

    // Initial data load
    useEffect(() => {
        const loadData = async () => {
            try {
                const classData = await fetchClasses();
                setClasses(classData);
                await loadProjects();
                await loadTeams();
            } catch (err) {
                setError(err.message || 'Failed to load data');
            }
        };
        loadData();
    }, []);

    // Assign teams to project
    const handleAssignTeam = async (projectId, teamIds) => {
        try {
            if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
                throw new Error('Invalid project ID');
            }
            await assignTeamToProject(projectId, teamIds);  // teamIds is already an array
            setSuccess('Teams assigned successfully');
            await loadProjects();
            handleCloseAssignTeams();
        } catch (err) {
            setError(err.message || 'Failed to assign teams');
        } finally {
            setTimeout(() => {
                setSuccess('');
                setError('');
            }, 3000);
        }
    };

    // Edit project handler
    const handleEdit = (projectId) => setEditProjectId(projectId);
    const handleCloseEdit = async (updatedProject) => {
        setEditProjectId(null);
        if (updatedProject) {
            // Update the projects array directly with the updated project
            setProjects(prevProjects => 
                prevProjects.map(project => 
                    project._id === updatedProject._id ? updatedProject : project
                )
            );
            // Also update filtered projects
            setFilteredProjects(prevProjects => 
                prevProjects.map(project => 
                    project._id === updatedProject._id ? updatedProject : project
                )
            );
            setSuccess('Project updated successfully');
            setTimeout(() => {
                setSuccess('');
            }, 3000);
        } else {
            // Fallback to loading all projects if no updated project was returned
            await loadProjects();
        }
    };

    // Assign classes handlers
    const handleOpenAssignClasses = (projectId) => {
        setSelectedProjectId(projectId);
        setSelectedClasses([]);
        setAssignClassesModal(true);
    };

    const handleCloseAssignClasses = () => {
        setAssignClassesModal(false);
        setSelectedProjectId(null);
    };

    const handleAssignClasses = async () => {
        try {
            if (!selectedProjectId || selectedClasses.length === 0) {
                setError('Please select a project and at least one class');
                return;
            }
            const classIds = selectedClasses.map(cls => cls._id);
            await assignClassesToProject(selectedProjectId, classIds);
            setSuccess('Classes assigned successfully');
            handleCloseAssignClasses();
            await loadProjects();
        } catch (err) {
            setError(err.message || 'Failed to assign classes');
        } finally {
            setTimeout(() => {
                setSuccess('');
                setError('');
            }, 3000);
        }
    };

    // Assign teams handlers
    const handleOpenAssignTeams = (projectId) => {
        setSelectedProjectId(projectId);
        setSelectedTeams([]);
        setAssignTeamsModal(true);
    };

    const handleCloseAssignTeams = () => {
        setAssignTeamsModal(false);
        setSelectedProjectId(null);
    };

    const handleProjectCreated = async () => {
        setShowCreateModal(false);
        await loadProjects();
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ color: '#dd2825' }}>Projects Management</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowCreateModal(true)}
                    sx={{ backgroundColor: '#dd2825', '&:hover': { backgroundColor: '#c42020' } }}
                >
                    Create Project
                </Button>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="project status tabs">
                    <Tab label="All Projects" />
                    <Tab label="Recommended" />
                    <Tab label="Approved" />
                    <Tab label="Rejected" />
                </Tabs>
            </Box>
            
            <ProjectsList
                role="ADMIN"
                projects={filteredProjects}
                onEdit={handleEdit}
                onAssignClasses={handleOpenAssignClasses}
                onAssignTeam={handleOpenAssignTeams}
                onDelete={handleDelete}
                onApprove={handleApproveProject}
                onReject={handleRejectProject}
                teams={teams}
            />
            {/* Create Project Dialog */}
            <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogContent>
                    <AdminProjectCreate onProjectCreated={handleProjectCreated} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCreateModal(false)}>Close</Button>
                </DialogActions>
            </Dialog>
            {/* Edit Project Dialog */}
            <Dialog open={!!editProjectId} onClose={handleCloseEdit} maxWidth="md" fullWidth>
                <DialogTitle>Edit Project</DialogTitle>
                <DialogContent>
                    {editProjectId && <AdminProjectEdit projectId={editProjectId} onClose={handleCloseEdit} />}
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => loadProjects()} 
                        startIcon={<RefreshIcon />}
                        color="primary"
                    >
                        Refresh Data
                    </Button>
                    <Button onClick={handleCloseEdit}>Close</Button>
                </DialogActions>
            </Dialog>
            {/* Assign Classes Dialog */}
            <Dialog open={assignClassesModal} onClose={handleCloseAssignClasses}>
                <DialogTitle>Assign Classes to Project</DialogTitle>
                <DialogContent>
                    <Autocomplete
                        multiple
                        options={classes}
                        getOptionLabel={(option) => option.name}
                        value={selectedClasses}
                        onChange={(event, newValue) => setSelectedClasses(newValue)}
                        renderInput={(params) => <TextField {...params} label="Select Classes" variant="outlined" fullWidth />}
                        sx={{ mt: 2, width: 300 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAssignClasses}>Cancel</Button>
                    <Button onClick={handleAssignClasses}>Assign</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProjectsManagement;