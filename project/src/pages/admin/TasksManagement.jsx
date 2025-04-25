// project/src/pages/admin/TeamsManagement.jsx
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { fetchAllTeams } from '../../api/teamApi';

const TeamsManagement = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const teamsData = await fetchAllTeams();
                setTeams(teamsData);
                setLoading(false);
            } catch (err) {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <Typography>Loading...</Typography>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ color: '#dd2825', mb: 3 }}>
                All Teams
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Team Name</TableCell>
                            <TableCell>Class</TableCell>
                            <TableCell>Created By</TableCell>
                            <TableCell>Members</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {teams.map(team => (
                            <TableRow key={team._id}>
                                <TableCell>{team.name}</TableCell>
                                <TableCell>{team.classRef}</TableCell>
                                <TableCell>{`${team.createdBy.firstName} ${team.createdBy.lastName}`}</TableCell>
                                <TableCell>
                                    {team.members.map(m => `${m.user.firstName} ${m.user.lastName}`).join(', ')}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default TeamsManagement;