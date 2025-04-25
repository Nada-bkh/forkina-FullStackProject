// src/components/tutor/TeamSubmissionTable.jsx
import React, { useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, FormControl, Select, MenuItem, InputLabel,
    Typography, Box, Chip, Collapse, IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const TeamSubmissionTable = ({ teamSubmissions, subjects, onAssign }) => {
    const [expandedRows, setExpandedRows] = useState({});
    const [selectedSubjects, setSelectedSubjects] = useState({});

    const toggleRowExpanded = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleSubjectChange = (teamId, subjectId) => {
        setSelectedSubjects(prev => ({
            ...prev,
            [teamId]: subjectId
        }));
    };

    const handleAssignTeam = (teamId) => {
        const subjectId = selectedSubjects[teamId];
        if (subjectId) {
            onAssign(teamId, subjectId);
        }
    };

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Team Name</TableCell>
                        <TableCell>Class</TableCell>
                        <TableCell>First Choice</TableCell>
                        <TableCell>Second Choice</TableCell>
                        <TableCell>Current Assignment</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {teamSubmissions.map((team) => (
                        <React.Fragment key={team._id}>
                            <TableRow>
                                <TableCell>{team.teamName}</TableCell>
                                <TableCell>{team.class}</TableCell>
                                <TableCell>{team.firstChoice?.title || 'N/A'}</TableCell>
                                <TableCell>{team.secondChoice?.title || 'N/A'}</TableCell>
                                <TableCell>
                                    {team.assignedSubject ? (
                                        <Chip
                                            label={team.assignedSubject.title}
                                            color="success"
                                            variant="outlined"
                                        />
                                    ) : (
                                        <Chip label="Not Assigned" color="default" variant="outlined" />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => toggleRowExpanded(team._id)}
                                        >
                                            {expandedRows[team._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </IconButton>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => toggleRowExpanded(team._id)}
                                        >
                                            View Details
                                        </Button>
                                    </Box>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    style={{ paddingBottom: 0, paddingTop: 0 }}
                                >
                                    <Collapse in={expandedRows[team._id]} timeout="auto" unmountOnExit>
                                        <Box sx={{ m: 2 }}>
                                            <Typography variant="h6" gutterBottom>
                                                Motivational Letters
                                            </Typography>

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle1">First Choice:</Typography>
                                                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                                                    <Typography variant="body2">
                                                        {team.firstChoiceMotivation || 'No motivation letter provided'}
                                                    </Typography>
                                                </Paper>
                                            </Box>

                                            <Box sx={{ mb: 3 }}>
                                                <Typography variant="subtitle1">Second Choice:</Typography>
                                                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                                                    <Typography variant="body2">
                                                        {team.secondChoiceMotivation || 'No motivation letter provided'}
                                                    </Typography>
                                                </Paper>
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                                    <InputLabel>Assign Subject</InputLabel>
                                                    <Select
                                                        value={selectedSubjects[team._id] || ''}
                                                        onChange={(e) => handleSubjectChange(team._id, e.target.value)}
                                                        label="Assign Subject"
                                                    >
                                                        {subjects.map((subject) => (
                                                            <MenuItem key={subject._id} value={subject._id}>
                                                                {subject.title}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={() => handleAssignTeam(team._id)}
                                                    disabled={!selectedSubjects[team._id]}
                                                >
                                                    Assign
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Collapse>
                                </TableCell>
                            </TableRow>
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default TeamSubmissionTable;