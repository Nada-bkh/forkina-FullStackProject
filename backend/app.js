require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const session = require('express-session');
const passport = require('passport');
require('./config/passport');

// Import routes
const userRoutes = require('./routes/userRoutes');
const tutorResumeRoutes = require('./routes/tutorResumeRoutes');
const studentResumeRoutes = require('./routes/studentResumeRoutes');
const teamRoutes = require('./routes/teamRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const authRoutes = require('./routes/authRoutes');
const googleAuthRoutes = require('./routes/auth');
const faceDetectionRoutes = require('./routes/faceDetectionRoutes');
const fileRoutes = require('./routes/fileRoutes');
const classRoutes = require('./routes/classRoutes'); // Add this line
const projectRequestRoutes = require('./routes/projectRequestRoutes');
const projectApplicationRoutes = require('./routes/projectApplicationRoutes');
const assignmentRoutes = require('./routes/assignments.js');

const app = express();

// Connect to MongoDB
connectDB();

// Session configuration
app.use(
  session({
    secret: process.env.COOKIE_KEY || 'medinaLab_secure_cookie_key_2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Serve uploads directory statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use("/auth", googleAuthRoutes); // Google Auth routes
app.use("/api/auth", authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tutor-resumes', tutorResumeRoutes);
app.use('/api/student-resumes', studentResumeRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/face-detection', faceDetectionRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/classes', classRoutes); // Add this line
app.use('/api/project-requests', projectRequestRoutes);
app.use('/api/project-applications', projectApplicationRoutes);
app.use('/api/assignments', assignmentRoutes);
// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

// Server startup with port handling
const startServer = async () => {
  const PORT = 5001;
  try {
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is busy, trying ${PORT + 1}...`);
        server.close();
        app.listen(PORT + 1, () => {
          console.log(`Server running on port ${PORT + 1}`);
        });
      } else {
        console.error('Server error:', error);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();