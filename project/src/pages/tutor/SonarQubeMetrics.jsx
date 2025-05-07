// src/components/tutor/SonarQubeMetrics.jsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Grid,
    Chip,
    Alert
} from '@mui/material';
import {
    BugReport,
    Security,
    Code,
    Timeline,
    CheckCircle,
    Cancel
} from '@mui/icons-material';
import { LineChart, Line, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { api } from '../../api/axiosConfig';

const COLORS = ['#00C49F', '#FF8042', '#FFBB28', '#0088FE'];

const SonarQubeMetrics = ({ projectKey }) => {
    const { data, error, isLoading } = useQuery({
        queryKey: ['sonarqube', projectKey],
        queryFn: async () => {
            const response = await api.get(`/analytics/sonarqube/${projectKey}`);
            return response.data;
        },
        enabled: !!projectKey
    });

    const transformData = (metrics) => {
        const formatted = {};
        metrics.forEach(metric => {
            formatted[metric.metric] = parseFloat(metric.value);
        });

        return {
            coverage: formatted.coverage || 0,
            issues: {
                bugs: formatted.bugs || 0,
                vulnerabilities: formatted.vulnerabilities || 0,
                codeSmells: formatted.code_smells || 0
            },
            ratings: {
                security: formatted.security_rating || 0,
                reliability: formatted.reliability_rating || 0,
                maintainability: formatted.sqale_rating || 0
            },
            qualityGate: formatted.alert_status === 'OK' ? 'Passed' : 'Failed'
        };
    };

    const metricsData = data ? transformData(data) : null;

    if (isLoading) return <CircularProgress size={40} />;

    if (error) return (
        <Alert severity="error" sx={{ mt: 2 }}>
            Error loading metrics: {error.message}
        </Alert>
    );

    return (
        <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#dd2825' }}>
                <Code sx={{ mr: 1 }} /> Code Quality Metrics
            </Typography>

            {metricsData && (
                <Grid container spacing={3}>
                    {/* Quality Gate Status */}
                    <Grid item xs={12}>
                        <Box sx={{
                            p: 2,
                            backgroundColor: metricsData.qualityGate === 'Passed' ? '#e8f5e9' : '#ffebee',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            {metricsData.qualityGate === 'Passed' ? (
                                <CheckCircle sx={{ color: '#4caf50', mr: 1 }} />
                            ) : (
                                <Cancel sx={{ color: '#f44336', mr: 1 }} />
                            )}
                            <Typography>
                                Quality Gate: {metricsData.qualityGate}
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Coverage Trend */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                <Timeline sx={{ mr: 1 }} /> Code Coverage Trend
                            </Typography>
                            <LineChart width={400} height={200} data={coverageHistory}>
                                <Line
                                    type="monotone"
                                    dataKey="coverage"
                                    stroke="#dd2825"
                                    strokeWidth={2}
                                />
                                <Tooltip />
                            </LineChart>
                        </Paper>
                    </Grid>

                    {/* Issues Breakdown */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                <BugReport sx={{ mr: 1 }} /> Issues Breakdown
                            </Typography>
                            <PieChart width={400} height={200}>
                                <Pie
                                    data={[
                                        { name: 'Bugs', value: metricsData.issues.bugs },
                                        { name: 'Vulnerabilities', value: metricsData.issues.vulnerabilities },
                                        { name: 'Code Smells', value: metricsData.issues.codeSmells }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={60}
                                    fill="#8884d8"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </Paper>
                    </Grid>

                    {/* Rating Summary */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                <Security sx={{ mr: 1 }} /> Quality Ratings (1-5)
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={4}>
                                    <Chip
                                        label={`Security: ${metricsData.ratings.security}`}
                                        color={metricsData.ratings.security > 3 ? 'success' : 'error'}
                                    />
                                </Grid>
                                <Grid item xs={4}>
                                    <Chip
                                        label={`Reliability: ${metricsData.ratings.reliability}`}
                                        color={metricsData.ratings.reliability > 3 ? 'success' : 'error'}
                                    />
                                </Grid>
                                <Grid item xs={4}>
                                    <Chip
                                        label={`Maintainability: ${metricsData.ratings.maintainability}`}
                                        color={metricsData.ratings.maintainability > 3 ? 'success' : 'error'}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Paper>
    );
};

export default SonarQubeMetrics;