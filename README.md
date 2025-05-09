# Forkina – Academic Project Management Platform

## Overview
**Forkina** is a full-stack service-oriented web application designed to streamline academic project management within educational institutions. Built for students, tutors, and admins, it enables efficient team formation, project tracking, tutor assignment, deliverable submissions, and AI-enhanced decision support.

## Features
- 🧑‍🎓 Role-based user management (Student, Tutor, Admin)
- 📁 Project proposal submission and GitHub integration
- 📌 Team and tutor assignment with academic resume profiling
- 📊 AI-powered team formation and project success prediction
- 🔍 Plagiarism detection integration (future enhancement)
- 🚀 Continuous Integration using GitHub Actions
- ☁️ Deployment on Microsoft Azure

## Tech Stack

### Frontend
- **React** with **Vite**
- **Tailwind CSS** for modern UI

### Backend
- **Node.js** with **Express.js**
- **MongoDB** as the primary database

### DevOps & Tools
- **Git** for version control
- **GitHub Actions** for CI workflows
- **Microsoft Azure** for cloud deployment
- **Postman/Swagger** for API testing

## Directory Structure
```
forkina/
├── project/               # React + Vite frontend
├── github-actions-secret-manager #Github app
│   └── app.js/
│   └── index.js
├── backend/               # Node.js services (User, Projects, etc.)
│   ├── ai-service/              
│   └── config/ 
│   └── controllers/
│   └── middlewares/
│   └── models/
│   └── routes/
│   └── services/
│   └── uploads/
│   └── utils/      
└── .github/workflows/     # GitHub Actions CI pipeline
```

## Getting Started

### Prerequisites
- Node.js
- MongoDB
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Nada-bkh/forkina-FullStackProject.git
   ```

2. Install and run backend services:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

   Repeat for other services.

3. Start the frontend:
   ```bash
   cd project
   npm install
   npm run dev
   ```

4. Access the app:
    - Frontend: `http://localhost:5173`
    - Backend: `http://localhost:5001`

## Acknowledgments
- Developed as part of an academic curriculum at **ESPRIT**
- Special thanks to mentors and team members for their guidance and support

---

> **Keywords**: academic project management, React, Node.js, MongoDB, GitHub Actions, Azure deployment, project tracking, student collaboration, tutor assignment, CI/CD, Vite, Tailwind CSS
