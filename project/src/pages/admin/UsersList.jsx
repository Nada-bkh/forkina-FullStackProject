// src/pages/admin/UsersList.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Chip,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { fetchUsers, deleteUser, updateUser, createUser } from '../../api/userApi';
import DeleteConfirmDialog from '../../components/dialogs/DeleteConfirmDialog';
import UserDetailsDialog from '../../components/dialogs/UserDetailsDialog';
import UserFormDialog from '../../components/dialogs/UserFormDialog';
import UserEditDialog from '../../components/dialogs/UserEditDialog';

const UsersList = () => {
  // State management
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [newClass, setNewClass] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // Get current role based on route
  const getRole = () => {
    if (location.pathname.includes('/students')) return 'STUDENT';
    if (location.pathname.includes('/tutors')) return 'TUTOR';
    return null;
  };

  // Queries and Mutations
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users', getRole()],
    queryFn: () => fetchUsers(getRole())
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setDeleteDialogOpen(false);
      showSnackbar('User deleted successfully', 'success');
    },
    onError: () => {
      showSnackbar('Failed to delete user', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setEditDialogOpen(false);
      showSnackbar('User updated successfully', 'success');
    },
    onError: () => {
      showSnackbar('Failed to update user', 'error');
    }
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setFormDialogOpen(false);
      showSnackbar('User created successfully', 'success');
    },
    onError: () => {
      showSnackbar('Failed to create user', 'error');
    }
  });

  // Mutation pour assigner une classe
  const assignClassMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSnackbar({
        open: true,
        message: 'Classe assignée avec succès',
        severity: 'success'
      });
      setClassDialogOpen(false);
    },
    onError: (error) => {
      console.error('Erreur lors de l\'assignation de classe:', error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message || 'Échec de l\'assignation de classe'}`,
        severity: 'error'
      });
    }
  });

  // Helper Functions
  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const getRoleChipColor = (role) => {
    if (!role) return 'default';
    const upperRole = role.toUpperCase();
    switch (upperRole) {
      case 'ADMIN': return 'error';
      case 'TUTOR': return 'warning';
      case 'STUDENT': return 'primary';
      default: return 'default';
    }
  };

  // Handler Functions
  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
  };

  const handleAddNew = () => {
    setFormDialogOpen(true);
  };

  const handleFormSubmit = (formData) => {
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (formData) => {
    // Assurez-vous que l'ID est correctement passé
    const updateData = {
      ...formData,
      _id: formData._id // Utilisez _id de MongoDB
    };
    
    // Supprimez les champs non nécessaires ou invalides
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;
    
    console.log('Updating user with data:', updateData);
    updateMutation.mutate(updateData);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleQuickClassAssign = (user) => {
    setSelectedUser(user);
    setNewClass(user.classe === '--' ? '' : user.classe);
    setClassDialogOpen(true);
  };

  const handleClassAssignSubmit = () => {
    if (selectedUser) {
      // Envoi uniquement des champs nécessaires pour éviter tout conflit
      assignClassMutation.mutate({
        _id: selectedUser._id,
        classe: newClass || '--'
      });
    }
  };

  if (isLoading) return <LinearProgress />;

  return (
    <Box>
      {/* Header avec navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 1 }}>
            {getRole() ? `${getRole().charAt(0) + getRole().slice(1).toLowerCase()}s Management` : 'All Users'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
  <Button
    size="small"
    variant={!getRole() ? 'contained' : 'outlined'}
    onClick={() => navigate('/admin/users')}
    sx={{
      backgroundColor: !getRole() ? '#dd2825 !important' : 'transparent',
      color: !getRole() ? 'white' : '#dd2825 !important',
      borderColor: '#dd2825 !important',
      '&:hover': {
        backgroundColor: !getRole() ? '#C42050' : 'rgba(221, 37, 88, 0.04)',
        borderColor: '#DD2558'
      }
    }}
  >
    All Users
  </Button>
  <Button
    size="small"
    variant={getRole() === 'STUDENT' ? 'contained' : 'outlined'}
    onClick={() => navigate('/admin/users/students')}
    sx={{
      backgroundColor: getRole() === 'STUDENT' ? '#dd2825 !important' : 'transparent',
      color: getRole() === 'STUDENT' ? 'white' : '#dd2825 !important',
      borderColor: '#dd2825 !important',
      '&:hover': {
        backgroundColor: getRole() === 'STUDENT' ? '#C42050' : 'rgba(221, 37, 88, 0.04)',
        borderColor: '#DD2558'
      }
    }}
  >
    Students
  </Button>
  <Button
    size="small"
    variant={getRole() === 'TUTOR' ? 'contained' : 'outlined'}
    onClick={() => navigate('/admin/users/tutors')}
    sx={{
      backgroundColor: getRole() === 'TUTOR' ? '#dd2825 !important' : 'transparent',
      color: getRole() === 'TUTOR' ? 'white' : '#dd2825 !important',
      borderColor: '#dd2825 !important',
      '&:hover': {
        backgroundColor: getRole() === 'TUTOR' ? '#C42050' : 'rgba(221, 37, 88, 0.04)',
        borderColor: '#DD2558'
      }
    }}
  >
    Tutors
  </Button>
</Box>
        </Box>
        <Button
  variant="contained"
  startIcon={<AddIcon />}
  onClick={handleAddNew}
  sx={{
    backgroundColor: '#dd2825 !important',
    color: 'white',
    '&:hover': {
      backgroundColor: '#A4A4A4'  // slightly darker shade for hover
    }
  }}
>
  Add New User
</Button>
      </Box>

      {/* Afficher un message si aucun utilisateur */}
      {users.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No {getRole()?.toLowerCase() || 'users'} found
          </Typography>
        </Paper>
      ) : (
        /* Table existante */
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                {getRole() === 'STUDENT' && (
                  <>
                    <TableCell>CIN</TableCell>
                    <TableCell>Classe</TableCell>
                  </>
                )}
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.idUser}>
                  <TableCell>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  {getRole() === 'STUDENT' && (
                    <>
                      <TableCell>{user.cin || 'Non renseigné'}</TableCell>
                      <TableCell>
                        {user.classe === '--' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label="Non affecté" size="small" color="warning" />
                            <IconButton
                              size="small"
                              title="Assigner une classe"
                              onClick={() => handleQuickClassAssign(user)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {user.classe}
                            <IconButton
                              size="small"
                              title="Modifier la classe"
                              onClick={() => handleQuickClassAssign(user)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <Chip 
                      label={user.userRole || user.role || 'N/A'} 
                      color={getRoleChipColor(user.userRole || user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.accountStatus ? 'Active' : 'Inactive'}
                      color={user.accountStatus ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      onClick={() => handleViewDetails(user)} 
                      size="small"
                      title="View Details"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleEdit(user)} 
                      size="small"
                      title="Edit User"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDelete(user)} 
                      size="small"
                      title="Delete User"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialogs */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => deleteMutation.mutate(selectedUser._id)}
        userName={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : ''}
      />

      <UserDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        user={selectedUser}
      />

      <UserFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        onSubmit={handleFormSubmit}
        mode="create"
      />

      <UserEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleEditSubmit}
        user={selectedUser}
      />

      {/* Boîte de dialogue pour assigner une classe */}
      <Dialog open={classDialogOpen} onClose={() => setClassDialogOpen(false)}>
        <DialogTitle>
          {selectedUser?.classe === '--' ? 'Assigner une classe' : 'Modifier la classe'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Classe"
            fullWidth
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
            placeholder="Exemple: 3A15, 2B22, etc."
            helperText="Entrez la classe de l'étudiant"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClassDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleClassAssignSubmit} variant="contained" color="primary">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UsersList;
