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
  Avatar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  ExitToApp as ExitToAppIcon,
  AccountCircle as AccountCircleIcon,
  Task as TaskIcon,
  Class as ClassIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Sidebar.css';

const drawerWidth = 240;

const TutorSidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon style={{ color: 'white' }} />,
      path: '/tutor'
    },
    {
      text: 'Profile',
      icon: <AccountCircleIcon style={{ color: 'white' }} />,
      path: '/tutor/profile'
    },
    {
      text: 'Classes',
      icon: <ClassIcon style={{ color: 'white' }} />, // Using ClassIcon for Classes
      path: '/tutor/classes'
    },
    {
      text: 'Students',
      icon: <PeopleIcon style={{ color: 'white' }} />, // Using PeopleIcon for Students
      path: '/tutor/students'
    },
    {
      text: 'Projects',
      icon: <TaskIcon style={{ color: 'white' }} />, // Using TaskIcon for Projects
      path: '/tutor/projects'
    },
    {
      text: 'Assignments',
      icon: <AssignmentIcon style={{ color: 'white' }} />, // Using AssignmentIcon for Assignments
      path: '/tutor/assignments' // Assuming a new route for managing assignments
    },
    {
      text: 'Groups',
      icon: <GroupIcon style={{ color: 'white' }} />, // Using GroupIcon for Groups
      path: '/tutor/groups' // Assuming a new route for managing groups
    }
  ];

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.replace('/signin');
        return;
      }

      await axios.post('http://localhost:5001/api/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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
          bgcolor: 'background.paper'
        },
      }}
    >
      <Toolbar sx={{ minHeight: '100px' }}>
        <Box
          component="div"
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <img 
            src="/Lab2.png" 
            alt="Logo"
            style={{ height: '80px', objectFit: 'contain' }}
          /> 
        </Box>
      </Toolbar>

      <Divider />
      
      {user && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Avatar 
            src={user.profilePicture || user.faceImage ? `http://localhost:5001${user.profilePicture || user.faceImage}` : null} 
            sx={{ 
              width: 80, 
              height: 80, 
              margin: '0 auto 1rem',
              bgcolor: '#dd2825'
            }}
          >
            {(!user.profilePicture && !user.faceImage) && user.firstName?.charAt(0)}
          </Avatar>
          <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
            {user.firstName} {user.lastName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'white' }}>
            Tutor
          </Typography>
        </Box>
      )}

      <Divider />
      
      <List>
        {menuItems.map((item) => (
          <Box key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          </Box>
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