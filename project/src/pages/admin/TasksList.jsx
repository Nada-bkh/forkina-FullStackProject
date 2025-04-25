import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchTasksByProject, createTask, deleteTask } from '../../api/taskApi';

const TasksList = ({ role }) => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState('');
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: ''
    });

    useEffect(() => {
        const loadTasks = async () => {
            try {
                const taskData = await fetchTasksByProject(projectId);
                setTasks(taskData);
            } catch (err) {
                setError(err.message);
            }
        };
        loadTasks();
    }, [projectId]);

    const handleCreateTask = async () => {
        try {
            const taskData = {
                ...newTask,
                projectRef: projectId,
                dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : undefined,
            };
            await createTask(taskData);
            setOpenCreateDialog(false);
            setNewTask({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '' });
            const updatedTasks = await fetchTasksByProject(projectId);
            setTasks(updatedTasks);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await deleteTask(taskId);
                const updatedTasks = await fetchTasksByProject(projectId);
                setTasks(updatedTasks);
            } catch (err) {
                setError(err.message);
            }
        }
    };

    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Tasks for Project</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenCreateDialog(true)}
                    sx={{ backgroundColor: '#dd2825', '&:hover': { backgroundColor: '#c42020' } }}
                >
                    Add Task
                </Button>
            </Box>
            {tasks.length === 0 ? (
                <Typography>No tasks found.</Typography>
            ) : (
                <List>
                    {tasks.map(task => (
                        <ListItem key={task._id} secondaryAction={
                            <IconButton edge="end" onClick={() => handleDeleteTask(task._id)} color="error">
                                <DeleteIcon />
                            </IconButton>
                        }>
                            <ListItemText
                                primary={task.title}
                                secondary={`Status: ${task.status} | Priority: ${task.priority} | Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}`}
                            />
                        </ListItem>
                    ))}
                </List>
            )}
            <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Task Title"
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            required
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={4}
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={newTask.status}
                                onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                                label="Status"
                            >
                                <MenuItem value="TODO">To Do</MenuItem>
                                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                                <MenuItem value="REVIEW">Review</MenuItem>
                                <MenuItem value="COMPLETED">Completed</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Priority</InputLabel>
                            <Select
                                value={newTask.priority}
                                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                label="Priority"
                            >
                                <MenuItem value="LOW">Low</MenuItem>
                                <MenuItem value="MEDIUM">Medium</MenuItem>
                                <MenuItem value="HIGH">High</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Due Date"
                            type="date"
                            value={newTask.dueDate}
                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateTask} variant="contained" sx={{ backgroundColor: '#dd2825', color: 'white' }}>
                        Create Task
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TasksList;