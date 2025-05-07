// src/pages/tutor/SonarQubeDashboard.jsx
import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip
} from '@mui/material';
import {
    BugReport,
    Security,
    Code,
    Timeline,
    CheckCircle,
    Cancel
} from '@mui/icons-material';
import { LineChart, Line, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/axiosConfig';

const COLORS = ['#dd2825', '#ff6b6b', '#4ecdc4', '#45b7d1'];

const SonarQubeDashboard = () => {
    const [selectedProject, setSelectedProject] = useState('');
    const { data, error, isLoading } = useQuery({
        queryKey: ['sonarqube', selectedProject],
        queryFn: async () => {
            const response = await api.get(`/analytics/sonarqube/${selectedProject}`);
            return response.data;
        },
        enabled: !!selectedProject
    });

    // Sample projects with SonarQube keys - replace with your actual data
    const projects = [
        { id: 1, name: 'VitalEase', sonarqubeKey: 'com.forkina:vitease' },
        { id: 2, name: 'MedinaLab', sonarqubeKey: 'com.forkina:medinalab' }
    ];

    const transformMetrics = (metrics) => {
        const formatted = {};
        metrics.forEach(metric => {
            formatted[metric.metric] = parseFloat(metric.value);
        });

        return {
            coverage: formatted.coverage || 0,
            bugs: formatted.bugs || 0,
            vulnerabilities: formatted.vulnerabilities || 0,
            codeSmells: formatted.code_smells || 0,
            securityRating: formatted.security_rating || 0,
            reliabilityRating: formatted.reliability_rating || 0,
            maintainabilityRating: formatted.sqale_rating || 0,
            qualityGate: formatted.alert_status === 'OK' ? 'Passed' : 'Failed'
        };
    };

    const metrics = data ? transformMetrics(data) : null;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3, color: '#dd2825' }}>
                <Code sx={{ mr: 2 }} /> Code Quality Dashboard
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <FormControl fullWidth>
                    <InputLabel>Select Project</InputLabel>
                    <Select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        label="Select Project"
                    >
                        {projects.map(project => (
                            <MenuItem key={project.id} value={project.sonarqubeKey}>
                                {project.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress size={60} sx={{ color: '#dd2825' }} />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    Error loading SonarQube data: {error.message}
                </Alert>
            )}

            {metrics && (
                <Grid container spacing={3}>
                    {/* Quality Gate Status */}
                    <Grid item xs={12}>
                        <Paper sx={{
                            p: 3,
                            backgroundColor: metrics.qualityGate === 'Passed' ? '#e8f5e9' : '#ffebee',
                            borderLeft: `6px solid ${metrics.qualityGate === 'Passed' ? '#4caf50' : '#f44336'}`
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {metrics.qualityGate === 'Passed' ? (
                                    <CheckCircle sx={{ color: '#4caf50', fontSize: 40 }} />
                                ) : (
                                    <Cancel sx={{ color: '#f44336', fontSize: 40 }} />
                                )}
                                <Box>
                                    <Typography variant="h6" sx={{ color: '#dd2825' }}>
                                        Quality Gate Status
                                    </Typography>
                                    <Typography variant="h4">
                                        {metrics.qualityGate}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Coverage Chart */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: 300 }}>
                            <Typography variant="h6" sx={{ mb: 2, color: '#dd2825' }}>
                                <Timeline sx={{ mr: 1 }} /> Code Coverage
                            </Typography>
                            <ResponsiveContainer width="100%" height="80%">
                                <LineChart data={[{ coverage: 0 }, { coverage: metrics.coverage }]}>
                                    <Line
                                        type="monotone"
                                        dataKey="coverage"
                                        stroke="#dd2825"
                                        strokeWidth={2}
                                        dot={{ fill: '#dd2825' }}
                                    />
                                    <Tooltip
                                        formatter={(value) => [`${value.toFixed(1)}%`, 'Coverage']}
                                        contentStyle={{ background: '#fff', border: '1px solid #ddd' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* Issues Breakdown */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: 300 }}>
                            <Typography variant="h6" sx={{ mb: 2, color: '#dd2825' }}>
                                <BugReport sx={{ mr: 1 }} /> Issues Breakdown
                            </Typography>
                            <ResponsiveContainer width="100%" height="80%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Bugs', value: metrics.bugs },
                                            { name: 'Vulnerabilities', value: metrics.vulnerabilities },
                                            { name: 'Code Smells', value: metrics.codeSmells }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        innerRadius={40}
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [value, name]}
                                        contentStyle={{ background: '#fff', border: '1px solid #ddd' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* Quality Ratings */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2, color: '#dd2825' }}>
                                <Security sx={{ mr: 1 }} /> Quality Ratings (1-5 Scale)
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={4}>
                                    <Chip
                                        label={`Security: ${metrics.securityRating}`}
                                        sx={{
                                            backgroundColor: metrics.securityRating > 3 ? '#e8f5e9' : '#ffebee',
                                            color: metrics.securityRating > 3 ? '#4caf50' : '#f44336',
                                            fontSize: '1.1rem',
                                            padding: '12px 20px'
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={4}>
                                    <Chip
                                        label={`Reliability: ${metrics.reliabilityRating}`}
                                        sx={{
                                            backgroundColor: metrics.reliabilityRating > 3 ? '#e8f5e9' : '#ffebee',
                                            color: metrics.reliabilityRating > 3 ? '#4caf50' : '#f44336',
                                            fontSize: '1.1rem',
                                            padding: '12px 20px'
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={4}>
                                    <Chip
                                        label={`Maintainability: ${metrics.maintainabilityRating}`}
                                        sx={{
                                            backgroundColor: metrics.maintainabilityRating > 3 ? '#e8f5e9' : '#ffebee',
                                            color: metrics.maintainabilityRating > 3 ? '#4caf50' : '#f44336',
                                            fontSize: '1.1rem',
                                            padding: '12px 20px'
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default SonarQubeDashboard;