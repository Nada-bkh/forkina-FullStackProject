import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Grid, Chip, InputAdornment, IconButton, FormControl, InputLabel, Select, MenuItem, FormHelperText, Paper, Alert, LinearProgress, Autocomplete } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { fetchProjectById, updateProject } from '../../api/projectApi';
import { fetchClasses } from '../../api/classApi';
import { fetchAllTeams } from '../../api/teamApi';
import dayjs from 'dayjs';

const AdminProjectEdit = ({ projectId, role = 'ADMIN', onClose }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [classes, setClasses] = useState([]);
    const [teams, setTeams] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [selectedTeams, setSelectedTeams] = useState([]);  // Changed to array to support multiple teams

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: dayjs(),
        endDate: dayjs().add(30, 'day'),
        status: 'PENDING',
        tags: []
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [projectData, classData, teamData] = await Promise.all([
                    fetchProjectById(projectId),
                    fetchClasses(),
                    fetchAllTeams()
                ]);
                const project = projectData.project || projectData;
                setFormData({
                    name: project.name,
                    description: project.description || '',
                    startDate: project.startDate ? dayjs(project.startDate) : dayjs(),
                    endDate: project.endDate ? dayjs(project.endDate) : dayjs().add(30, 'day'),
                    status: project.status || 'PENDING',
                    tags: project.tags || []
                });
                setSelectedClasses(project.classes || []);
                setSelectedTeams(project.teamRef || []);  // Initialize as array
                setClasses(classData);
                setTeams(teamData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [projectId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleDateChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleTagInputChange = (e) => setTagInput(e.target.value);

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
            setTagInput('');
        }
    };

    const handleDeleteTag = (tagToDelete) => {
        setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToDelete) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const projectData = {
                name: formData.name,
                description: formData.description,
                startDate: formData.startDate.format('YYYY-MM-DD'),
                endDate: formData.endDate.format('YYYY-MM-DD'),
                status: formData.status,
                tags: formData.tags,
                classIds: selectedClasses.map(cls => cls._id),
                teamIds: selectedTeams.map(team => team._id)  // Send array of team IDs
            };
            const updatedProject = await updateProject(projectId, projectData);
            setSuccess('Project updated successfully');
            
            // Force an immediate refresh
            if (onClose) {
                setTimeout(() => {
                    onClose(updatedProject); // Pass the updated project back to parent
                }, 1000);
            } else {
                setTimeout(() => {
                    navigate(`/admin/projects/${projectId}`);
                }, 1000);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        if (onClose) {
            onClose();
        } else {
            navigate(`/admin/projects/${projectId}`);
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading project details...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mr: 2 }}>Back</Button>
                <Typography variant="h5" sx={{ color: '#dd2825' }}>Edit Project</Typography>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
            <Paper sx={{ p: 4 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                name="name"
                                label="Project Name"
                                value={formData.name}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                disabled={saving}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="description"
                                label="Description"
                                value={formData.description}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={4}
                                disabled={saving}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Start Date"
                                    value={formData.startDate}
                                    onChange={(newValue) => handleDateChange('startDate', newValue)}
                                    slotProps={{ textField: { fullWidth: true } }}
                                    disabled={saving}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="End Date"
                                    value={formData.endDate}
                                    onChange={(newValue) => handleDateChange('endDate', newValue)}
                                    slotProps={{ textField: { fullWidth: true } }}
                                    minDate={formData.startDate}
                                    disabled={saving}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    label="Status"
                                    disabled={saving}
                                >
                                    <MenuItem value="PENDING">Pending</MenuItem>
                                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                                    <MenuItem value="COMPLETED">Completed</MenuItem>
                                    <MenuItem value="ARCHIVED">Archived</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Autocomplete
                                multiple
                                options={classes}
                                getOptionLabel={(option) => option.name}
                                value={selectedClasses}
                                onChange={(event, newValue) => setSelectedClasses(newValue)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Assign Classes" placeholder="Search classes..." />
                                )}
                                fullWidth
                                disabled={saving}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Autocomplete
                                multiple  // Enable multiple team selection
                                options={teams}
                                getOptionLabel={(option) => option.name}
                                value={selectedTeams}
                                onChange={(event, newValue) => setSelectedTeams(newValue)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Assign Teams" placeholder="Select teams..." />
                                )}
                                fullWidth
                                disabled={saving}
                                isOptionEqualToValue={(option, value) => option._id === value?._id}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Add Tag"
                                value={tagInput}
                                onChange={handleTagInputChange}
                                fullWidth
                                disabled={saving}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={handleAddTag} edge="end" disabled={!tagInput.trim() || saving}>
                                                <AddIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                            />
                            <FormHelperText>Press Enter or click the Add icon to add a tag</FormHelperText>
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {formData.tags.map((tag, index) => (
                                    <Chip key={index} label={tag} onDelete={() => handleDeleteTag(tag)} disabled={saving} />
                                ))}
                            </Box>
                        </Grid>
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={saving}
                                sx={{ backgroundColor: '#dd2825', '&:hover': { backgroundColor: '#c42020' } }}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default AdminProjectEdit;