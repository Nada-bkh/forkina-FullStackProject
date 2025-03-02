// src/components/layout/DashboardLayout.jsx
import { Box, Toolbar } from '@mui/material';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}> {/* Ensure full height layout */}
  <Sidebar />

  <Box
    component="main"
    sx={{
      flexGrow: 1,
      p: 4,
      minHeight: '100vh', /* Match sidebar height */
      bgcolor: 'background.default',
      overflow: 'auto', /* Prevent content overflow */
    }}
  >
    <Toolbar sx={{ minHeight: '14px' }} /> {/* Ensure spacing for AppBar */}
    <Outlet />
  </Box>
</Box>

  );
};

export default DashboardLayout;