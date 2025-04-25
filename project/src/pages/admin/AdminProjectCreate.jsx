import { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Grid, Chip, InputAdornment, IconButton, FormHelperText, Alert, Autocomplete } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createProject } from '../../api/projectApi';
import { fetchClasses } from '../../api/classApi';
import dayjs from 'dayjs';
import AddIcon from '@mui/icons-material/Add';

const AdminProjectCreate = ({ onProjectCreated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [classes, setClasses] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: dayjs(),
        endDate: dayjs().add(30, 'day'),
        tags: []
    });

    useEffect(() => {
        const loadClasses = async () => {
            try {
                const classData = await fetchClasses();
                console.log('Fetched classes for create:', classData); // Debug log
                setClasses(classData);
            } catch (err) {
                setError(err.message);
            }
        };
        loadClasses();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (name, date) => {
        setFormData(prev => ({ ...prev, [name]: date }));
    };

    const handleTagInputChange = (e) => setTagInput(e.target.value);

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
            setTagInput('');
        }
    };

    const handleDeleteTag = (tagToDelete) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToDelete) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const projectData = {
                name: formData.name,
                description: formData.description,
                startDate: formData.startDate.format('YYYY-MM-DD'),
                endDate: formData.endDate.format('YYYY-MM-DD'),
                tags: formData.tags,
                status: 'PENDING',
                classIds: selectedClasses.map(cls => cls._id)
            };
            console.log('Creating project with:', projectData); // Debug log
            const data = await createProject(projectData);
            setSuccess(true);
            setFormData({ name: '', description: '', startDate: dayjs(), endDate: dayjs().add(30, 'day'), tags: [] });
            setSelectedClasses([]);
            if (onProjectCreated) onProjectCreated(); // Notify parent to refresh
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, color: '#dd2825' }}>Create New Project</Typography>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }}>Project created successfully!</Alert>}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField required fullWidth label="Project Name" name="name" value={formData.name} onChange={handleChange} disabled={loading} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField required fullWidth multiline rows={4} label="Project Description" name="description" value={formData.description} onChange={handleChange} disabled={loading} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Start Date" value={formData.startDate} onChange={(date) => handleDateChange('startDate', date)}
                                    slotProps={{ textField: { fullWidth: true, required: true } }} disabled={loading}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="End Date" value={formData.endDate} onChange={(date) => handleDateChange('endDate', date)}
                                    slotProps={{ textField: { fullWidth: true, required: true } }} disabled={loading} minDate={formData.startDate}
                                />
                            </LocalizationProvider>
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
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth label="Add Tags" value={tagInput} onChange={handleTagInputChange} disabled={loading}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={handleAddTag} disabled={!tagInput.trim() || loading}><AddIcon /></IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                            />
                            <FormHelperText>Press Enter or click the Add icon to add tags</FormHelperText>
                            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {formData.tags.map((tag) => (
                                    <Chip key={tag} label={tag} onDelete={() => handleDeleteTag(tag)} color="primary" disabled={loading} />
                                ))}
                            </Box>
                        </Grid>
                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Button
                                type="submit" variant="contained" disabled={loading} fullWidth
                                sx={{ backgroundColor: '#dd2825', color: 'white', '&:hover': { backgroundColor: '#c42020' } }}
                            >
                                {loading ? 'Creating...' : 'Create Project'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default AdminProjectCreate;