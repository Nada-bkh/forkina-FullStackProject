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
import TeamManagement from "./pages/student/TeamManagement";
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
import StudentsList from './pages/tutor/StudentsList';
import ClassesList from './pages/tutor/ClassesList';
import ClassDetails from './pages/tutor/components/ClassDetails';
import ClassesManagement from './pages/admin/ClassesManagement';
import TeamsList from "./pages/tutor/TeamsList.jsx";
import ProjectsManagement from "./pages/admin/ProjectsManagement";
import TasksManagement from "./pages/admin/TasksManagement";
import TeamsManagement from "./pages/admin/TeamsManagement";
import StudentProjects from "./pages/student/StudentProjects";
import ProjectApply from "./pages/student/ProjectApply";
import AiAssignmentPanel from "./pages/tutor/components/AiAssignmentPanel.jsx";
import EvaluationGrid from "./pages/tutor/EvaluationGrid.jsx";
import EvaluationDetail from "./pages/tutor/TeamEvaluationView.jsx";
import TeamProjects from "./pages/student/TeamProjects.jsx";
import SonarQubeDashboard from "./pages/tutor/SonarQubeDashboard.jsx";
import ProjectDetailView from "./pages/student/ProjectDetailView.jsx";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 1000,
      refetchOnWindowFocus: true,
      retry: 1
    },
  },
});

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

              <Route path="/admin" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/admin/users" replace />} />
                <Route path="profile" element={<Profile />} />
                <Route path="users" element={<UsersList />} />
                <Route path="users/students" element={<UsersList />} />
                <Route path="users/tutors" element={<UsersList />} />
                <Route path="users/admins" element={<UsersList />} />

                <Route path="submit-task" element={<SubmitTask />} />
                <Route path="classes" element={<ClassesManagement />} />
                <Route path="projects" element={<ProjectsManagement />} />
                <Route path="projects/:projectId" element={<ProjectDetails role="ADMIN" />} />
                <Route path="projects/:projectId/edit" element={<ProjectEdit role="ADMIN" />} />
                <Route path="projects/:projectId/tasks" element={<TasksList role="ADMIN" />} />
                <Route path="projects/:projectId/tasks/create" element={<TaskCreate role="ADMIN" />} />
                <Route path="projects/:projectId/tasks/:taskId" element={<TaskDetails role="ADMIN" />} />
                <Route path="projects/:projectId/tasks/:taskId/edit" element={<TaskEdit role="ADMIN" />} />
                <Route path="tasks" element={<TasksManagement />} />
                <Route path="teams" element={<TeamsManagement />} />
              </Route>

              {/* Student Dashboard Routes */}
              <Route path="/student" element={<StudentDashboardLayout />}>
                <Route index element={<StudentDashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="projects" element={<StudentProjects />} />
                <Route path="team-projects" element={<TeamProjects role="STUDENT" />} />
                <Route path="projects/apply" element={<ProjectApply />} />
                <Route path="projects/:projectId" element={<ProjectDetails />} />
                <Route path="projects/:projectId/tasks" element={<TasksList role="STUDENT" />} />
                <Route path="projects/:projectId/tasks/:taskId" element={<TaskDetails role="STUDENT" />} />
                <Route path="tasks" element={<TasksList role="STUDENT" />} />
                <Route path="tasks/:taskId" element={<TaskDetails role="STUDENT" />} />
                <Route path="team" element={<TeamManagement />} />
                <Route path="/student/projectgithub/:projectId" element={<ProjectDetailView role="STUDENT" />} />
              </Route>

              {/* Tutor Dashboard Routes */}
              <Route path="/tutor" element={<TutorDashboardLayout />}>
                <Route index element={<TutorDashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="students" element={<StudentsList />} />
                <Route path="projects" element={<ProjectsList />} />
                <Route path="projects/create" element={<ProjectCreate />} />
                <Route path="teams/:teamId/evaluate" element={<EvaluationGrid />} />
                <Route path="evaluationdetails/:teamId" element={<EvaluationDetail role="TUTOR" />} />
                <Route path="projects/:projectId/tasks" element={<TasksList role="TUTOR" />} />
                <Route path="projects/:projectId/tasks/create" element={<TaskCreate role="TUTOR" />} />
                <Route path="projects/:projectId/tasks/:taskId" element={<TaskDetails role="TUTOR" />} />
                <Route path="projects/:projectId/tasks/:taskId/edit" element={<TaskEdit role="TUTOR" />} />
                <Route path="classes" element={<ClassesList />} />
                <Route path="classes/:classId" element={<ClassDetails />} />
                <Route path="teams" element={<AiAssignmentPanel />} />
                <Route path="teams/eval" element={<TeamsList />} />
                <Route path="sonarqube-dashboard" element={<SonarQubeDashboard />} />

              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
);

export default App;
