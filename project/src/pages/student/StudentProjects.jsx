// project/src/pages/student/StudentProjects.jsx
import { Box, Typography, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ProjectsList from './ProjectsList'; // Reuse the existing ProjectsList component
import { fetchAllProjects } from '../../api/projectApi';

const StudentProjects = () => {
    const navigate = useNavigate();
    const { data: projects = [], isLoading, error, refetch } = useQuery({
        queryKey: ['projects', 'student'],
        queryFn: () => fetchAllProjects('STUDENT'),
    });

    const handleApplyToProject = () => {
        navigate('/student/projects/apply');
    };

    if (isLoading) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography>Loading projects...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography color="error">Error: {error.message}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ color: '#dd2825' }}>
                    My Projects
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AssignmentIcon />}
                        onClick={handleApplyToProject}
                        sx={{ backgroundColor: '#dd2825', '&:hover': { backgroundColor: '#c42020' } }}
                    >
                        Candidater à un projet
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<RefreshIcon />}
                        onClick={() => refetch()}
                        sx={{ backgroundColor: '#dd2825', '&:hover': { backgroundColor: '#c42020' } }}
                    >
                        Refresh
                    </Button>
                </Box>
            </Box>
            <ProjectsList role="STUDENT" projects={projects} />
        </Box>
    );
};

export default StudentProjects;