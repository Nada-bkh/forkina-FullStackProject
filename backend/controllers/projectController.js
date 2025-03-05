// controllers/projectController.js

const Project = require('../models/projectModel'); // Updated to use the correct model

// GET all projects
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find(); // Fetch all projects from the database
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// POST a new project
const createProject = async (req, res) => {
  const { githubLink, subject, level, name } = req.body; // Extract data from the request body

  if (!githubLink || !subject || !level || !name) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    const newProject = new Project({
      githubLink,
      subject,
      level,
      name,
    });

    await newProject.save(); // Save the project to the database
    res.status(201).json(newProject); // Respond with the newly created project
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getProjects,
  createProject,
};
