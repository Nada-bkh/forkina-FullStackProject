import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { GoogleOAuthProvider } from '@react-oauth/google';
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/layout/DashboardLayout";
import UsersList from "./pages/admin/UsersList";
import ForgotPassword from "./pages/forgotPassword";
import ResetPassword from "./pages/reserPassword";
import SubmitTask from "./pages/admin/SubmitTask"; 
import Profile from "./pages/admin/Profile";
import AuthTransfer from "./pages/AuthTransfer";


const theme = createTheme({
  palette: {
    primary: {
      main: '#A4A4A4',
    },
    secondary: {
      main: '#F1F0FB',
    },
    error: {
      main: '#ea384c',
    },
    text: {
      primary: '#222222',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
  },
});

const queryClient = new QueryClient();

const App = () => (
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/signin" replace />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/auth-transfer" element={<AuthTransfer />} />

            
            {/* Admin Dashboard Routes */}
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/admin/users" replace />} />
              <Route path="profile" element={<Profile />} />
              <Route path="users" element={<UsersList />} />
              <Route path="users/students" element={<UsersList />} />
              <Route path="users/tutors" element={<UsersList />} />
              <Route path="submit-task" element={<SubmitTask />} /> 
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;