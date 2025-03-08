import { useState, useEffect } from 'react';
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
  Divider
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Mail as MailIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const StudentsList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = students.filter(student => 
        student.firstName.toLowerCase().includes(lowercasedQuery) ||
        student.lastName.toLowerCase().includes(lowercasedQuery) ||
        student.email.toLowerCase().includes(lowercasedQuery) ||
        (student.cin && student.cin.toLowerCase().includes(lowercasedQuery)) ||
        (student.classe && student.classe.toLowerCase().includes(lowercasedQuery))
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const getProfileImageUrl = (student) => {
    if (!student) return null;
    
    if (student.profilePicture || student.faceImage || student.avatar || student.profileImage) {
      const imagePath = student.profilePicture || student.faceImage || student.avatar || student.profileImage;
      
      if (imagePath.startsWith('http')) {
        return imagePath;
      } else {
        return `http://localhost:5001${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
      }
    }
    
    return null;
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('http://localhost:5001/api/users?role=STUDENT', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch students');
      }
      
      const data = await response.json();
      
      console.log('Student data sample:', data.length > 0 ? {
        imageFields: {
          profilePicture: data[0].profilePicture,
          avatar: data[0].avatar,
          profileImage: data[0].profileImage,
          faceImage: data[0].faceImage
        }
      } : 'No students');
      
      const processedData = data.map(student => {
        const imageUrl = getProfileImageUrl(student);
        
        console.log(`Student ${student.firstName}: Image fields:`, {
          profilePicture: student.profilePicture ? 'exists' : 'missing',
          faceImage: student.faceImage ? 'exists' : 'missing',  
          resolvedUrl: imageUrl
        });
        
        return {
          ...student,
          displayImage: imageUrl
        };
      });
      
      setStudents(processedData);
      setFilteredStudents(processedData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleViewDetails = (studentId) => {
    const student = students.find(s => s._id === studentId);
    if (student) {
      setSelectedStudent(student);
      setDetailsDialogOpen(true);
    }
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
  };

  const handleContactStudent = (email) => {
    window.location.href = `mailto:${email}`;
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, color: '#dd2825' }}>Students Management</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search students by name, email, CIN or class..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Paper>
      
      {loading ? (
        <LinearProgress />
      ) : filteredStudents.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">No students found</Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            {searchQuery ? "No students match your search criteria. Try different keywords." : "No students are currently registered in the system."}
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Student</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>CIN</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Education Level</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((student) => (
                    <TableRow key={student._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            src={student.displayImage}
                            alt={`${student.firstName} ${student.lastName}`}
                            sx={{ 
                              mr: 2,
                              width: 40,
                              height: 40,
                              border: '1px solid #eee',
                              position: 'relative'
                            }}
                          >
                            {student.firstName ? student.firstName.charAt(0) : ''}
                            {student.lastName ? student.lastName.charAt(0) : ''}
                            
                            {student.profilePicture && 
                              <Tooltip title="Using profilePicture">
                                <Box sx={{ position: 'absolute', bottom: -3, right: -3, width: 8, height: 8, borderRadius: '50%', bgcolor: 'green' }} />
                              </Tooltip>
                            }
                            {!student.profilePicture && student.faceImage && 
                              <Tooltip title="Using faceImage">
                                <Box sx={{ position: 'absolute', bottom: -3, right: -3, width: 8, height: 8, borderRadius: '50%', bgcolor: 'blue' }} />
                              </Tooltip>
                            }
                          </Avatar>
                          <Typography>
                            {student.firstName} {student.lastName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.cin || 'Not provided'}</TableCell>
                      <TableCell>
                        {student.classe === '--' ? (
                          <Chip label="Not assigned" size="small" color="warning" />
                        ) : (
                          student.classe || 'Not assigned'
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={student.educationLevel || 'BEGINNER'} 
                          size="small"
                          color={
                            student.educationLevel === 'ADVANCED' ? 'success' :
                            student.educationLevel === 'INTERMEDIATE' ? 'primary' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={student.accountStatus ? 'Active' : 'Inactive'} 
                          color={student.accountStatus ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton 
                            onClick={() => handleViewDetails(student._id)}
                            size="small"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                     
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredStudents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}

      {/* Student Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
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
                    alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                    sx={{ width: 150, height: 150, mb: 2, border: '1px solid #eee', position: 'relative' }}
                  >
                    {selectedStudent.firstName?.charAt(0)}
                    {selectedStudent.lastName?.charAt(0)}
                    
                    {selectedStudent.profilePicture && 
                      <Tooltip title="Using profilePicture">
                        <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 15, height: 15, borderRadius: '50%', bgcolor: 'green' }} />
                      </Tooltip>
                    }
                    {!selectedStudent.profilePicture && selectedStudent.faceImage && 
                      <Tooltip title="Using faceImage">
                        <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 15, height: 15, borderRadius: '50%', bgcolor: 'blue' }} />
                      </Tooltip>
                    }
                  </Avatar>
                  
                  {(selectedStudent.profilePicture || selectedStudent.faceImage) && (
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                      {selectedStudent.profilePicture ? "Using profile picture" : "Using face image"}
                    </Typography>
                  )}
                  
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </Typography>
                  <Chip 
                    label={selectedStudent.accountStatus ? 'Active' : 'Inactive'} 
                    color={selectedStudent.accountStatus ? 'success' : 'error'}
                    size="small"
                    sx={{ mb: 2 }}
                  />

                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Personal Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{selectedStudent.email}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Phone</Typography>
                      <Typography variant="body1">{selectedStudent.phone || 'Not provided'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">CIN</Typography>
                      <Typography variant="body1">{selectedStudent.cin || 'Not provided'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Birth Date</Typography>
                      <Typography variant="body1">
                        {selectedStudent.birthDate 
                          ? new Date(selectedStudent.birthDate).toLocaleDateString() 
                          : 'Not provided'}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Academic Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Class</Typography>
                      {selectedStudent.classe === '--' ? (
                        <Chip label="Not assigned" size="small" color="warning" />
                      ) : (
                        <Typography variant="body1">{selectedStudent.classe}</Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Education Level</Typography>
                      <Chip 
                        label={selectedStudent.educationLevel || 'BEGINNER'} 
                        size="small"
                        color={
                          selectedStudent.educationLevel === 'ADVANCED' ? 'success' :
                          selectedStudent.educationLevel === 'INTERMEDIATE' ? 'primary' : 'default'
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Department</Typography>
                      <Typography variant="body1">{selectedStudent.department || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Team</Typography>
                      <Typography variant="body1">{selectedStudent.teamRef ? 'Assigned' : 'Not assigned'}</Typography>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Account Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Account Status</Typography>
                      <Chip 
                        label={selectedStudent.accountStatus ? 'Active' : 'Inactive'} 
                        color={selectedStudent.accountStatus ? 'success' : 'error'}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Email Verified</Typography>
                      <Chip 
                        label={selectedStudent.isEmailVerified ? 'Verified' : 'Not verified'} 
                        color={selectedStudent.isEmailVerified ? 'success' : 'warning'}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Created At</Typography>
                      <Typography variant="body1">
                        {selectedStudent.createdAt 
                          ? new Date(selectedStudent.createdAt).toLocaleDateString() 
                          : 'Unknown'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Last Login</Typography>
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
              <Button onClick={handleCloseDetails}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default StudentsList; 