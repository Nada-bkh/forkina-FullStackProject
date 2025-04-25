// controllers/classController.js
const Class = require('../models/classModel');
const User = require('../models/userModel');
const Project = require('../models/projectModel');

// Create a new class (Admin only)
exports.createClass = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.userRole !== 'ADMIN') { // Changed role to userRole
      return res.status(403).json({ message: 'Only admins can create classes' });
    }
    const { name, description, tutorIds } = req.body; // Changed tutorId to tutorIds
    const tutors = await User.find({ _id: { $in: tutorIds }, userRole: 'TUTOR' });
    if (tutors.length !== tutorIds.length) {
      return res.status(400).json({ message: 'One or more tutor IDs are invalid or users are not tutors' });
    }
    const existingClass = await Class.findOne({ name });
    if (existingClass) {
      return res.status(400).json({ message: 'Class name already exists' });
    }
    const newClass = new Class({
      name,
      description,
      tutors: tutorIds, // Changed tutor to tutors
      createdBy: req.user.id,
      students: []
    });
    await newClass.save();
    // Assign class to tutors
    await User.updateMany(
        { _id: { $in: tutorIds } },
        { classe: newClass._id }
    );
    await newClass.populate('tutors', 'firstName lastName email');
    await newClass.populate('createdBy', 'firstName lastName email');
    return res.status(201).json(newClass);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Add students to a class (Admin only)
exports.addStudentsToClass = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.userRole !== 'ADMIN') { // Changed role to userRole
      return res.status(403).json({ message: 'Only admins can add students to classes' });
    }
    const { classId, studentIds } = req.body;
    console.log('Adding students to class:', classId, studentIds); // Added logging
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }
    const students = await User.find({ _id: { $in: studentIds }, userRole: 'STUDENT' });
    if (students.length !== studentIds.length) {
      return res.status(400).json({ message: 'One or more student IDs are invalid or users are not students' });
    }
    for (const student of students) {
      if (student.classe && student.classe.toString() !== classId) {
        return res.status(400).json({ message: `Student ${student.email} is already assigned to another class` });
      }
    }
    classDoc.students = [...new Set([...classDoc.students, ...studentIds])];
    await classDoc.save();
    console.log('Updated class students:', classDoc.students); // Added logging
    await User.updateMany(
        { _id: { $in: studentIds } },
        { classe: classId }
    );
    const updatedClassDoc = await Class.findById(classId)
        .populate('students', 'firstName lastName email')
        .populate('tutors', 'firstName lastName email') // Changed tutor to tutors
        .populate('createdBy', 'firstName lastName email');
    return res.json(updatedClassDoc);
  } catch (err) {
    console.error('Error adding students:', err); // Added logging
    return res.status(400).json({ error: err.message });
  }
};

// Get all classes (Admin or Tutor)
exports.getAllClasses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let query = {};
    if (user.userRole === 'TUTOR') { // Changed role to userRole
      query.tutors = req.user.id; // Changed tutor to tutors
    }
    const classes = await Class.find(query)
        .populate('tutors', 'firstName lastName email') // Changed tutor to tutors
        .populate('students', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email');
    return res.json(classes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get a specific class by ID (Admin or Tutor)
exports.getClassById = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const classDoc = await Class.findById(req.params.id)
        .populate('tutors', 'firstName lastName email') // Changed tutor to tutors
        .populate('students', 'firstName lastName email cin classe educationLevel')
        .populate('createdBy', 'firstName lastName email');
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }
    if (user.userRole === 'TUTOR' && !classDoc.tutors.some(tutor => tutor._id.toString() === req.user.id)) { // Changed role to userRole and tutor to tutors
      return res.status(403).json({ message: 'You do not have access to this class' });
    }
    return res.json(classDoc);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Update a class (Admin only)
exports.updateClass = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.userRole !== 'ADMIN') { // Changed role to userRole
      return res.status(403).json({ message: 'Only admins can update classes' });
    }
    const { name, description, tutorIds } = req.body; // Changed tutorId to tutorIds
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }
    if (tutorIds) {
      const newTutors = await User.find({ _id: { $in: tutorIds }, userRole: 'TUTOR' });
      if (newTutors.length !== tutorIds.length) {
        return res.status(400).json({ message: 'One or more tutor IDs are invalid or users are not tutors' });
      }
      // Remove class assignment from old tutors
      await User.updateMany(
          { _id: { $in: classDoc.tutors }, classe: classDoc._id }, // Changed tutor to tutors
          { classe: null }
      );
      // Assign class to new tutors
      await User.updateMany(
          { _id: { $in: tutorIds } },
          { classe: classDoc._id }
      );
      classDoc.tutors = tutorIds; // Changed tutor to tutors
    }
    if (name) classDoc.name = name;
    if (description) classDoc.description = description;
    await classDoc.save();
    await classDoc.populate('tutors', 'firstName lastName email'); // Changed tutor to tutors
    await classDoc.populate('students', 'firstName lastName email');
    await classDoc.populate('createdBy', 'firstName lastName email');
    return res.json(classDoc);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Delete a class (Admin only)
exports.deleteClass = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.userRole !== 'ADMIN') { // Changed role to userRole
      return res.status(403).json({ message: 'Only admins can delete classes' });
    }
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }
    // Remove class assignment from tutors
    await User.updateMany(
        { _id: { $in: classDoc.tutors }, classe: classDoc._id }, // Changed tutor to tutors
        { classe: null }
    );
    // Remove class assignment from students
    await User.updateMany(
        { _id: { $in: classDoc.students } },
        { classe: null }
    );
    // Delete the class
    await Class.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get all students across all classes for a tutor
exports.getAllStudentsForTutor = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.userRole !== 'TUTOR') { // Changed role to userRole
      return res.status(403).json({ message: 'Only tutors can access this endpoint' });
    }
    const classes = await Class.find({ tutors: req.user.id }); // Changed tutor to tutors
    const studentIds = classes.reduce((acc, curr) => {
      return [...acc, ...curr.students];
    }, []);
    const uniqueStudentIds = [...new Set(studentIds.map(id => id.toString()))];
    const students = await User.find({
      _id: { $in: uniqueStudentIds },
      userRole: 'STUDENT'
    }).select('firstName lastName email cin classe educationLevel accountStatus');
    return res.json(students);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get projects for a class
exports.getProjectsForClass = async (req, res) => {
  try {
    const classId = req.params.classId;
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    const projects = await Project.find({ classes: classId })
        .populate('tutorRef', 'firstName lastName email')
        .populate('teamRef', 'name')
        .populate('members.user', 'firstName lastName email');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects for class:', error);
    res.status(500).json({ message: 'Server error while fetching projects' });
  }
};