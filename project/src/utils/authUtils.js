import { jwtDecode } from 'jwt-decode'; // Change to named import

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

export const getUserRole = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const decoded = jwtDecode(token); // Use named import
    return decoded.userRole || decoded.role || null; // Adjust based on your token structure
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const isAdmin = () => getUserRole() === 'ADMIN';