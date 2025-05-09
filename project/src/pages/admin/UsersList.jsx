import { useState, useEffect } from 'react';
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
    TextField,
    Avatar,
    useTheme,
    MenuItem,
    TablePagination, // Import TablePagination
    FormControl,
    InputLabel,
    Select,
    InputAdornment, // Import InputAdornment
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Add as AddIcon,
    People as PeopleIcon,

    School as SchoolIcon,
    AssignmentInd as CINIcon,
    AutoStories as TutorIcon,    // Littérature/enseignement
    Person as PersonIcon,
    AdminPanelSettings as AdminIcon, // Nouvelle icône pour les admins


    CheckCircle,
    Cancel,
    PersonAdd,
    LockOpen,
    Lock,
    Search as SearchIcon, // Import SearchIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { fetchUsers, deleteUser, updateUser, createUser } from '../../api/userApi';
import { fetchClasses } from '../../api/classApi';
import DeleteConfirmDialog from '../../components/dialogs/DeleteConfirmDialog';
import UserDetailsDialog from '../../components/dialogs/UserDetailsDialog';
import UserFormDialog from '../../components/dialogs/UserFormDialog';
import UserEditDialog from '../../components/dialogs/UserEditDialog';

// Custom styled components
const RedGradientButton = styled(Button)(({ theme }) => ({
    background: `linear-gradient(45deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.light} 100%)`,
    color: theme.palette.common.white,
    '&:hover': {
        background: `linear-gradient(45deg, ${theme.palette.error.dark} 30%, ${theme.palette.error.light} 90%)`,
    },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    '&:hover': {
        backgroundColor: theme.palette.action.selected,
    },
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
    fontWeight: 600,
    borderRadius: 4,
    backgroundColor: status ? theme.palette.success.light : theme.palette.error.light,
    color: status ? theme.palette.success.dark : theme.palette.error.dark,
    '& .MuiChip-icon': {
        color: status ? theme.palette.success.dark : theme.palette.error.dark,
    },
}));

const UsersList = () => {
    const theme = useTheme();
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
        severity: 'success',
    });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState(''); // State for search query
    const [filteredUsers, setFilteredUsers] = useState([]); // State for filtered users

    // Fetch classes for the dropdown
    const { data: classes = [] } = useQuery({
        queryKey: ['classes'],
        queryFn: fetchClasses,
    });

    // Get current role based on route
    const getRole = () => {
        if (location.pathname.includes('/students')) return 'STUDENT';
        if (location.pathname.includes('/tutors')) return 'TUTOR';
        if (location.pathname.includes('/admins')) return 'ADMIN';

        return null;
    };

    // Queries and Mutations
    const { data: users = [], isLoading, error } = useQuery({
        queryKey: ['users', getRole()],
        queryFn: () => fetchUsers(getRole()),
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
        },
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
        },
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
        },
    });

    const assignClassMutation = useMutation({
        mutationFn: updateUser,
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            setClassDialogOpen(false);
            showSnackbar('Class assigned successfully', 'success');
        },
        onError: () => {
            showSnackbar('Failed to assign class', 'error');
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: updateUser,
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            showSnackbar('Account status updated successfully', 'success');
        },
        onError: () => {
            showSnackbar('Failed to update account status', 'error');
        },
    });

    useEffect(() => {
        setPage(0); // Reset page to the first page when users data changes
    }, [users]);

    useEffect(() => {
      const filtered = users.filter(user => {
        const query = searchQuery.toLowerCase().trim();
        const queryParts = query.split(' ');
  
        const isNumericQuery = /^\d+$/.test(query);
        const cleanedCin = user.cin ? user.cin.replace(/\D/g, '') : '';
  
        if (isNumericQuery) {
          // Si la recherche est un nombre → ne filtrer que les CIN numériques commençant par la séquence
          return cleanedCin.startsWith(query);
        }
  
        if (queryParts.length === 1 && queryParts[0]) {
          return (
            user.firstName.toLowerCase().startsWith(queryParts[0]) ||
            user.lastName.toLowerCase().startsWith(queryParts[0]) ||
            user.email.toLowerCase().includes(queryParts[0])
          );
        } else if (queryParts.length >= 2 && queryParts[0] && queryParts[1]) {
          const firstNameMatch = user.firstName.toLowerCase().startsWith(queryParts[0]);
          const lastNameMatch = user.lastName.toLowerCase().startsWith(queryParts[1]);
          return firstNameMatch && lastNameMatch;
        }
  
        return !searchQuery;
      });
  
      setFilteredUsers(filtered);
      setPage(0);
    }, [users, searchQuery]);
  
  

    // Helper Functions
    const showSnackbar = (message, severity) => {
        setSnackbar({
            open: true,
            message,
            severity,
        });
    };

    const getRoleChipColor = (role) => {
        const upperRole = role?.toUpperCase();
        return upperRole === 'ADMIN' ? 'error' : 'default';
    };

    // Handler Functions
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
  
      const handleQuickClassAssign = (user) => {
          setSelectedUser(user);
          setNewClass(user.classe ? user.classe._id : '');
          setClassDialogOpen(true);
      };
  
      const handleClassAssignSubmit = () => {
          if (selectedUser) {
              assignClassMutation.mutate({
                  _id: selectedUser._id,
                  classe: newClass || null,
              });
          }
      };
  
      const handleToggleAccountStatus = (user) => {
          updateStatusMutation.mutate({
              _id: user._id,
              accountStatus: !user.accountStatus,
          });
      };
  
      const handleChangePage = (event, newPage) => {
          setPage(newPage);
      };
  
      const handleChangeRowsPerPage = (event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
      };
  
      const handleSearchChange = (event) => {
          setSearchQuery(event.target.value);
      };
  
      const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredUsers.length) : 0;
  
      const visibleUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
      if (isLoading) return <LinearProgress />;
  
      return (
          <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
              {/* Header Section */}
              <Box
                  sx={{
                      mb: 4,
                      p: 3,
                      borderRadius: 2,
                      background: `linear-gradient(45deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.light} 100%)`,
                      boxShadow: 3,
                  }}
              >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                          {getRole() ? `${getRole()} Management` : 'User Management'}
                      </Typography>
                      <RedGradientButton
                          variant="contained"
                          startIcon={<PersonAdd sx={{ color: 'white' }} />}
                          onClick={handleAddNew}
                          sx={{
                              px: 4,
                              py: 1.5,
                              borderRadius: 2,
                              textTransform: 'none',
                              fontSize: '1.1rem',
                          }}
                      >
                          New {getRole() === 'STUDENT' ? 'Student' : getRole() === 'TUTOR' ? 'Tutor' : 'User'}
                      </RedGradientButton>
                  </Box>
                  {/* Search Bar */}
                  <TextField
                            variant="standard" // ou "filled", si tu veux un style différent
                            value={searchQuery}
                            onChange={handleSearchChange}
                            InputProps={{
                              disableUnderline: true, // nécessaire pour standard/filled
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SearchIcon color="action" />
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              width: '35%',
                              maxWidth: 400,
                              mb: 2,
                              bgcolor: 'white',
                              borderRadius: 3,
                              boxShadow: 1,
                          
                              // Augmenter la hauteur du champ
                              '& .MuiInputBase-root': {
                                height: 35, // ← Tu peux mettre 60, 64, selon le style désiré
                              },
                              '& .MuiInputBase-input': {
                                padding: '0 14px', // ← réduit le padding vertical, garde l'alignement correct
                                display: 'flex',
                                alignItems: 'center',
                                height: '100%', // ← garde l’input plein sur toute la hauteur dispo
                              },
                            }}
                          />

  
  
                  {/* Navigation */}
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      <Button
                          variant={!getRole() ? 'contained' : 'text'}
                          onClick={() => navigate('/admin/users')}
                          startIcon={<PeopleIcon />}
                          sx={{
                            color: 'white', // ← couleur texte forcée
                            bgcolor: !getRole() ? 'rgba(255,255,255,0.15)' : 'transparent',
                              '&:hover': {
                                  bgcolor: !getRole() ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.05)',
                              },
                          }}
                      >
                          All Users
                      </Button>
                      <Button
                          variant={getRole() === 'STUDENT' ? 'contained' : 'text'}
                          onClick={() => navigate('/admin/users/students')}
                          startIcon={<SchoolIcon />}
                          sx={{
                            color: 'white', // ← couleur texte forcée
                            bgcolor: getRole() === 'STUDENT' ? 'rgba(255,255,255,0.15)' : 'transparent',
                              '&:hover': {
                                  bgcolor: getRole() === 'STUDENT' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.05)',
                              },
                          }}
                      >
                          Students
                      </Button>
                      <Button
                          variant={getRole() === 'TUTOR' ? 'contained' : 'text'}
                          onClick={() => navigate('/admin/users/tutors')}
                          startIcon={<TutorIcon />}
                          sx={{
                            color: 'white', // ← couleur texte forcée
                            bgcolor: getRole() === 'TUTOR' ? 'rgba(255,255,255,0.15)' : 'transparent',
                              '&:hover': {
                                  bgcolor: getRole() === 'TUTOR' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.05)',
                              },
                          }}
                      >
                          Tutors
                      </Button>
                      <Button
                          variant={getRole() === 'ADMIN' ? 'contained' : 'text'}
                          onClick={() => navigate('/admin/users/admins')}
                          startIcon={<AdminIcon />}
                          sx={{
                            color: 'white', // ← couleur texte forcée
                            bgcolor: getRole() === 'ADMIN' ? 'rgba(255,255,255,0.15)' : 'transparent',
                              '&:hover': {
                                  bgcolor: getRole() === 'ADMIN' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.05)',
                              },
                          }}
                      >
                          Admins
                      </Button>
                  </Box>
              </Box>
  
              {/* Main Content */}
              {filteredUsers.length === 0 && searchQuery ? (
                  <Paper sx={{ p: 3, textAlign: 'center', boxShadow: 3 }}>
                      <Typography variant="h6" color="textSecondary">
                          No {getRole()?.toLowerCase() || 'users'} found matching "{searchQuery}"
                      </Typography>
                  </Paper>
              ) : (
                  <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
                      <Table>
                      <TableHead sx={{ bgcolor: theme.palette.error.light }}>
                                <TableRow>
                                  <TableCell sx={{ color: 'white!important', textAlign: 'left', fontWeight: 'bold' }}>User</TableCell>
                                  <TableCell sx={{ color: 'white!important', textAlign: 'left', fontWeight: 'bold' }}>Email</TableCell>
                                  {getRole() === 'STUDENT' && (
                                    <>
                                      <TableCell sx={{ color: 'white!important', textAlign: 'center', fontWeight: 'bold' }}>CIN</TableCell>
                                      <TableCell sx={{ color: 'white!important', textAlign: 'center', fontWeight: 'bold' }}>Class</TableCell>
                                    </>
                                  )}
                                  <TableCell sx={{ color: 'white!important', textAlign: 'center', fontWeight: 'bold' }}>Role</TableCell>
                                  <TableCell sx={{ color: 'white!important', textAlign: 'center', fontWeight: 'bold' }}>Status</TableCell>
                                  <TableCell sx={{ color: 'white!important', textAlign: 'center', fontWeight: 'bold' }}> {/* Align right for Actions, but bold */}
                                    Actions
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                          <TableBody>
                              {visibleUsers.map((user) => (
                                  <StyledTableRow key={user._id}>
                                      <TableCell>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                              <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                                                  {user.firstName[0]}
                                                  {user.lastName[0]}
                                              </Avatar>
                                              <Typography fontWeight="500">
                                                  {user.firstName} {user.lastName}
                                              </Typography>
                                          </Box>
                                      </TableCell>
                                      <TableCell>{user.email}</TableCell>
                                      {getRole() === 'STUDENT' && (
                                          <>
                                              <TableCell>
                                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                      <CINIcon color="action" />
                                                      {user.cin || 'N/A'}
                                                  </Box>
                                              </TableCell>
                                              <TableCell>
                                                  <Button
                                                      variant="text"
                                                      color={user.classe ? 'primary' : 'error'}
                                                      startIcon={<SchoolIcon />}
                                                      onClick={() => handleQuickClassAssign(user)}
                                                      sx={{ textTransform: 'none' }}
                                                  >
                                                      {user.classe?.name || 'Assign Class'}
                                                  </Button>
                                              </TableCell>
                                          </>
                                      )}
                                      <TableCell>
                                          <Chip
                                              label={user.userRole}
                                              color={getRoleChipColor(user.userRole)}
                                              variant="outlined"
                                              sx={{ fontWeight: 600 }}
                                          />
                                      </TableCell>
                                      <TableCell>
                                          <StatusChip
                                              status={user.accountStatus}
                                              icon={user.accountStatus ? <CheckCircle /> : <Cancel />}
                                              label={user.accountStatus ? 'Active' : 'Inactive'}
                                          />
                                      </TableCell>
                                      <TableCell align="right">
                                          <IconButton onClick={() => handleViewDetails(user)} color="default">
                                              <VisibilityIcon sx={{ color: theme.palette.text.secondary }} />
                                          </IconButton>
                                          <IconButton onClick={() => handleToggleAccountStatus(user)} color="default">
                                              {user.accountStatus ? (
                                                <Lock sx={{ color: '#CD5C5C' }} title="Lock Account" />                                              ) : (
                                                  <LockOpen sx={{ color: theme.palette.success.main }} title="Unlock Account" />
                                              )}
                                          </IconButton>
  
                                          <IconButton onClick={() => handleDelete(user)} color="error">
                                              <DeleteIcon sx={{ color: '#FF0000' }} />
                                          </IconButton>
                                      </TableCell>
                                  </StyledTableRow>
                              ))}
                              {emptyRows > 0 && (
                                  <TableRow style={{ height: 53 * emptyRows }}>
                                      <TableCell colSpan={6} />
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                      <TablePagination
                          rowsPerPageOptions={[5, 10, 25]}
                          component="div"
                          count={filteredUsers.length}
                          rowsPerPage={rowsPerPage}
                          page={page}
                          onPageChange={handleChangePage}
                          onRowsPerPageChange={handleChangeRowsPerPage}
                          labelRowsPerPage="Users per page:"
                      />
                  </TableContainer>
              )}
  
              {/* Dialogs */}
              <DeleteConfirmDialog
                  open={deleteDialogOpen}
                  onClose={() => setDeleteDialogOpen(false)}
                  onConfirm={() => deleteMutation.mutate(selectedUser?._id)}
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
                  role={getRole()} // Pass the role to the form
              />
  
  
              {/* Class Assignment Dialog */}
              <Dialog open={classDialogOpen} onClose={() => setClassDialogOpen(false)}>
                  <DialogTitle>{selectedUser?.classe ? 'Modify Class' : 'Assign Class'}</DialogTitle>
                  <DialogContent>
                      <TextField
                          select
                          fullWidth
                          label="Class"
                          value={newClass}
                          onChange={(e) => setNewClass(e.target.value)}
                          sx={{ mt: 2 }}
                      >
                          <MenuItem value="">No Class</MenuItem>
                          {classes.map((cls) => (
                              <MenuItem key={cls._id} value={cls._id}>
                                  {cls.name}
                              </MenuItem>
                          ))}
                      </TextField>
                  </DialogContent>
                  <DialogActions>
                      <Button onClick={() => setClassDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleClassAssignSubmit} color="error" variant="contained">
                          Save Changes
                      </Button>
                  </DialogActions>
              </Dialog>
  
              {/* Snackbar */}
              <Snackbar
                  open={snackbar.open}
                  autoHideDuration={6000}
                  onClose={() => setSnackbar({ ...snackbar, open: false })}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                  <Alert
                      onClose={() => setSnackbar({ ...snackbar, open: false })}
                      severity={snackbar.severity}
                      variant="filled"
                      sx={{ width: '100%' }}
                  >
                      {snackbar.message}
                  </Alert>
              </Snackbar>
          </Box>
      );
  };
  
  export default UsersList;