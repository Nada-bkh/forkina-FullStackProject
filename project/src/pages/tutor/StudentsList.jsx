import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  LinearProgress,
  Alert,
  Avatar,
  Tooltip,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Snackbar,
  useTheme,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Mail as MailIcon,
  Close as CloseIcon,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { fetchStudentsForTutor } from '../../api/classApi';

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

const StudentsList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch students using react-query
  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ['studentsForTutor'],
    queryFn: fetchStudentsForTutor,
    select: (data) =>
      data.map((student) => ({
        ...student,
      })),
  });

  // Filter students based on search query
  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    const filtered = students.filter((student) => {
      const queryParts = lowercasedQuery.split(' ');
      const isNumericQuery = /^\d+$/.test(lowercasedQuery);
      const cleanedCin = student.cin ? student.cin.replace(/\D/g, '') : '';

      if (isNumericQuery) {
        return cleanedCin.startsWith(lowercasedQuery);
      }

      if (queryParts.length === 1 && queryParts[0]) {
        return (
          student.firstName.toLowerCase().startsWith(queryParts[0]) ||
          student.lastName.toLowerCase().startsWith(queryParts[0]) ||
          student.email.toLowerCase().includes(queryParts[0])
        );
      } else if (queryParts.length >= 2 && queryParts[0] && queryParts[1]) {
        const firstNameMatch = student.firstName.toLowerCase().startsWith(queryParts[0]);
        const lastNameMatch = student.lastName.toLowerCase().startsWith(queryParts[1]);
        return firstNameMatch && lastNameMatch;
      }

      return !searchQuery;
    });
    setFilteredStudents(filtered);
    setPage(0);
  }, [students, searchQuery]);

  const getProfileImageUrl = (student) => {
    if (!student) return null;
    const imageFields = ['profilePicture', 'faceImage', 'avatar', 'profileImage'];
    const imagePath = imageFields.find((field) => student[field]);
    if (imagePath) {
      const path = student[imagePath];
      return path.startsWith('http') ? path : `http://localhost:5001${path.startsWith('/') ? '' : '/'}${path}`;
    }
    return null;
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleContactStudent = (email) => {
    window.location.href = `mailto:${email}`;
    showSnackbar('Opening email client', 'info');
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredStudents.length) : 0;
  const visibleStudents = filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
            Students Management
          </Typography>
        </Box>
        <TextField
          variant="standard"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by name, email, or CIN..."
          InputProps={{
            disableUnderline: true,
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
            '& .MuiInputBase-root': {
              height: 35,
            },
            '& .MuiInputBase-input': {
              padding: '0 14px',
              display: 'flex',
              alignItems: 'center',
              height: '100%',
            },
          }}
        />
      </Box>

      {/* Main Content */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.message || 'An error occurred while fetching students.'}
        </Alert>
      )}

      {filteredStudents.length === 0 && (searchQuery || !isLoading) ? (
        <Paper sx={{ p: 3, textAlign: 'center', boxShadow: 3 }}>
          <Typography variant="h6" color="textSecondary">
            No students found
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            {searchQuery
              ? `No students match "${searchQuery}"`
              : 'You have no students assigned to your classes.'}
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: theme.palette.error.light }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Student</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>CIN</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Education Level</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'right' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleStudents.map((student) => (
                  <StyledTableRow key={student._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={student.displayImage}
                          sx={{ bgcolor: theme.palette.error.main }}
                        >
                          {student.firstName?.charAt(0)}
                          {student.lastName?.charAt(0)}
                        </Avatar>
                        <Typography fontWeight="500">
                          {student.firstName} {student.lastName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.cin || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={student.educationLevel || 'BEGINNER'}
                        size="small"
                        color={
                          student.educationLevel === 'ADVANCED'
                            ? 'success'
                            : student.educationLevel === 'INTERMEDIATE'
                            ? 'primary'
                            : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        status={student.accountStatus}
                        icon={student.accountStatus ? <CheckCircle /> : <Cancel />}
                        label={student.accountStatus ? 'Active' : 'Inactive'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton onClick={() => handleViewDetails(student)}>
                          <VisibilityIcon sx={{ color: theme.palette.text.secondary }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Contact Student">
                        <IconButton onClick={() => handleContactStudent(student.email)}>
                          <MailIcon sx={{ color: theme.palette.text.secondary }} />
                        </IconButton>
                      </Tooltip>
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
              count={filteredStudents.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Students per page:"
            />
          </TableContainer>
        </>
      )}

      {/* Student Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        {selectedStudent && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Student Details</Typography>
                <IconButton onClick={handleCloseDetails}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar
                    src={selectedStudent.displayImage}
                    sx={{ width: 150, height: 150, mb: 2, border: `2px solid ${theme.palette.error.light}` }}
                  >
                    {selectedStudent.firstName?.charAt(0)}
                    {selectedStudent.lastName?.charAt(0)}
                  </Avatar>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </Typography>
                  <StatusChip
                    status={selectedStudent.accountStatus}
                    icon={selectedStudent.accountStatus ? <CheckCircle /> : <Cancel />}
                    label={selectedStudent.accountStatus ? 'Active' : 'Inactive'}
                  />
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Personal Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">{selectedStudent.email}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">{selectedStudent.phone || 'Not provided'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        CIN
                      </Typography>
                      <Typography variant="body1">{selectedStudent.cin || 'Not provided'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Birth Date
                      </Typography>
                      <Typography variant="body1">
                        {selectedStudent.birthDate
                          ? new Date(selectedStudent.birthDate).toLocaleDateString()
                          : 'Not provided'}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Academic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Class
                      </Typography>
                      <Typography variant="body1">{selectedStudent.classe?.name || 'Not assigned'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Education Level
                      </Typography>
                      <Chip
                        label={selectedStudent.educationLevel || 'BEGINNER'}
                        size="small"
                        color={
                          selectedStudent.educationLevel === 'ADVANCED'
                            ? 'success'
                            : selectedStudent.educationLevel === 'INTERMEDIATE'
                            ? 'primary'
                            : 'default'
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Department
                      </Typography>
                      <Typography variant="body1">{selectedStudent.department || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Team
                      </Typography>
                      <Typography variant="body1">{selectedStudent.teamRef ? 'Assigned' : 'Not assigned'}</Typography>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Account Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Account Status
                      </Typography>
                      <StatusChip
                        status={selectedStudent.accountStatus}
                        icon={selectedStudent.accountStatus ? <CheckCircle /> : <Cancel />}
                        label={selectedStudent.accountStatus ? 'Active' : 'Inactive'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Email Verified
                      </Typography>
                      <Chip
                        label={selectedStudent.isEmailVerified ? 'Verified' : 'Not verified'}
                        color={selectedStudent.isEmailVerified ? 'success' : 'warning'}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Created At
                      </Typography>
                      <Typography variant="body1">
                        {selectedStudent.createdAt
                          ? new Date(selectedStudent.createdAt).toLocaleDateString()
                          : 'Unknown'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Last Login
                      </Typography>
                      <Typography variant="body1">
                        {selectedStudent.lastLogin
                          ? new Date(selectedStudent.lastLogin).toLocaleDateString()
                          : 'Never'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <RedGradientButton onClick={handleCloseDetails}>Close</RedGradientButton>
            </DialogActions>
          </>
        )}
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

export default StudentsList;