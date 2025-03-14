// src/components/layout/TutorSidebar.jsx
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Toolbar,
  Box,
  Divider,
  Typography,
  Avatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  AccountCircle as AccountCircleIcon,
  ExitToApp as ExitToAppIcon,
  Class as ClassIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Sidebar.css';

const drawerWidth = 240;

const TutorSidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon style={{ color: 'white' }} />, path: '/tutor' },
    { text: 'Profile', icon: <AccountCircleIcon style={{ color: 'white' }} />, path: '/tutor/profile' },
    { text: 'Students', icon: <PeopleIcon style={{ color: 'white' }} />, path: '/tutor/students' },
    { text: 'Projects', icon: <AssignmentIcon style={{ color: 'white' }} />, path: '/tutor/projects' },
    { text: 'Classes', icon: <ClassIcon style={{ color: 'white' }} />, path: '/tutor/classes' },
    { text: 'Teams', icon: <GroupIcon style={{ color: 'white' }} />, path: '/tutor/teams' }, // New item
  ];

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.replace('/signin');
        return;
      }
      await axios.post('http://localhost:5001/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/signin');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/signin');
    }
  };

  return (
    <Drawer
      variant="permanent"
      className="sidebar"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
        },
      }}
    >
      <Toolbar sx={{ minHeight: '100px' }}>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <img src="/Lab2.png" alt="Logo" style={{ height: '80px', objectFit: 'contain' }} />
        </Box>
      </Toolbar>

      <Divider />

      {user && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Avatar
            src={user.profilePicture || user.faceImage ? `http://localhost:5001${user.profilePicture || user.faceImage}` : null}
            sx={{ width: 80, height: 80, margin: '0 auto 1rem', bgcolor: '#dd2825' }}
          >
            {(!user.profilePicture && !user.faceImage) && user.firstName?.charAt(0)}
          </Avatar>
          <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
            {user.firstName} {user.lastName}
          </Typography>
        </Box>
      )}

      <Divider />

      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <ExitToAppIcon style={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default TutorSidebar;