// src/components/layout/Sidebar.jsx
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
  People as PeopleIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  ExitToApp as ExitToAppIcon,
  AccountCircle as AccountCircleIcon,
  Class as ClassIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Sidebar.css';

const drawerWidth = 240;

const Sidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      text: 'Profile',
      icon: <AccountCircleIcon style={{ color: 'white' }} />,
      path: '/admin/profile'
    },
    {
      text: 'Users Management',
      icon: <PeopleIcon style={{ color: 'white' }} />,
      path: '/admin/users',
      subItems: [
        { text: 'All Users', icon: <PersonIcon style={{ color: 'white' }} />, path: '/admin/users' },
        { text: 'Students', icon: <SchoolIcon style={{ color: 'white' }} />, path: '/admin/users/students' },
        { text: 'Tutors', icon: <PersonIcon style={{ color: 'white' }} />, path: '/admin/users/tutors' }
      ]
    },
    {
      text: 'Classes Management',
      icon: <ClassIcon style={{ color: 'white' }} />,
      path: '/admin/classes'
    },
    {
      text: 'Projects',
      icon: <AssignmentIcon style={{ color: 'white' }} />,
      path: '/admin/projects'
    },
    {
      text: 'Assign Task',
      icon: <AssignmentIcon style={{ color: 'white' }} />,
      path: '/admin/submit-task'      
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
            {item.subItems && (
              <List component="div" disablePadding>
                {item.subItems.map((subItem) => (
                  <ListItemButton
                    key={subItem.text}
                    sx={{ pl: 4 }}
                    selected={location.pathname === subItem.path}
                    onClick={() => navigate(subItem.path)}
                  >
                    <ListItemIcon>{subItem.icon}</ListItemIcon>
                    <ListItemText primary={subItem.text} />
                  </ListItemButton>
                ))}
              </List>
            )}
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

export default Sidebar;