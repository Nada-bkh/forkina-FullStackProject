import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { GoogleOAuthProvider } from '@react-oauth/google';
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/layout/DashboardLayout";
import StudentDashboardLayout from "./components/layout/StudentDashboardLayout";
import TutorDashboardLayout from "./components/layout/TutorDashboardLayout";
import UsersList from "./pages/admin/UsersList";
import ForgotPassword from "./pages/forgotPassword";
import ResetPassword from "./pages/reserPassword";
import SubmitTask from "./pages/admin/SubmitTask"; 
import Profile from "./pages/admin/Profile";
import StudentDashboard from "./pages/student/Dashboard";
import TutorDashboard from "./pages/tutor/Dashboard";
import AuthTransfer from "./pages/AuthTransfer";
import VerifyEmail from "./pages/VerifyEmail";
import ProjectsList from "./pages/tutor/ProjectsList";
import ProjectCreate from "./pages/tutor/ProjectCreate";
import ProjectDetails from "./pages/tutor/ProjectDetails";
import ProjectEdit from "./pages/tutor/ProjectEdit";
import TasksList from "./pages/tutor/TasksList";
import TaskCreate from "./pages/tutor/TaskCreate";
import TaskDetails from "./pages/tutor/TaskDetails";
import TaskEdit from "./pages/tutor/TaskEdit";
import StudentProjectsList from "./pages/student/ProjectsList";
import StudentProjectDetails from "./pages/student/ProjectDetails";
import StudentTasksList from "./pages/student/TasksList";
import StudentTaskDetails from "./pages/student/TaskDetails";
import StudentProjectApply from "./pages/student/ProjectApply";
import StudentsList from './pages/tutor/StudentsList';
import ClassesList from './pages/tutor/ClassesList'; // New import pages/tutor/ClassesList
import ClassDetails from './pages/tutor/components/ClassDetails'; // New import
import ClassesManagement from './pages/admin/ClassesManagement'; // New import
import AdminProjectsReview from './pages/admin/AdminProjectsReview';

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
            <Route path="/verify-email/:token" element={<VerifyEmail />} />

            {/* Admin Dashboard Routes */}
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/admin/users" replace />} />
              <Route path="profile" element={<Profile />} />
              <Route path="users" element={<UsersList />} />
              <Route path="users/students" element={<UsersList />} />
              <Route path="users/tutors" element={<UsersList />} />
              <Route path="submit-task" element={<SubmitTask />} />
              <Route path="classes" element={<ClassesManagement />} />
              <Route path="projects" element={<AdminProjectsReview />} />
              <Route path="projects/:projectId" element={<ProjectDetails />} />
              <Route path="projects/:projectId/edit" element={<ProjectEdit />} />
            </Route>

            {/* Student Dashboard Routes */}
            <Route path="/student" element={<StudentDashboardLayout />}>
              <Route index element={<StudentDashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="projects" element={<StudentProjectsList />} />
              <Route path="projects/apply" element={<StudentProjectApply />} />
              <Route path="projects/:projectId" element={<StudentProjectDetails />} />
              <Route path="projects/:projectId/tasks" element={<StudentTasksList />} />
              <Route path="projects/:projectId/tasks/:taskId" element={<StudentTaskDetails />} />
              <Route path="tasks" element={<StudentTasksList />} />
              <Route path="tasks/:taskId" element={<StudentTaskDetails />} />
              <Route path="team" element={<div>Team Page</div>} />
            </Route>

            {/* Tutor Dashboard Routes */}
            <Route path="/tutor" element={<TutorDashboardLayout />}>
              <Route index element={<TutorDashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="students" element={<StudentsList />} />
              <Route path="evaluations" element={<div>Evaluations Page</div>} />
              <Route path="projects" element={<ProjectsList />} />
              <Route path="projects/create" element={<ProjectCreate />} />
              <Route path="projects/:projectId" element={<ProjectDetails />} />
              <Route path="projects/:projectId/edit" element={<ProjectEdit />} />
              <Route path="projects/:projectId/tasks" element={<TasksList />} />
              <Route path="projects/:projectId/tasks/create" element={<TaskCreate />} />
              <Route path="projects/:projectId/tasks/:taskId" element={<TaskDetails />} />
              
              <Route path="projects/:projectId/tasks/:taskId/edit" element={<TaskEdit />} />
              <Route path="classes" element={<ClassesList />} /> {/* New route */}
              <Route path="classes/:classId" element={<ClassDetails />} /> {/* New route */}
              <Route path="assignments" element={<div>Assignments Page</div>} /> {/* New route */}
              <Route path="groups" element={<div>Groups Page</div>} /> {/* New route */}
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;