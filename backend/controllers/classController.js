// controllers/classController.js
const Class = require('../models/classModel');
const User = require('../models/userModel');
const Project = require('../models/projectModel');
// Create a new class (Admin only)
exports.createClass = async (req, res) => {
  try {
    // Only admins can create classes
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can create classes' });
    }

    const { name, description, tutorId } = req.body;

    // Validate tutor
    const tutor = await User.findById(tutorId);
    if (!tutor || tutor.userRole !== 'TUTOR') {
      return res.status(400).json({ message: 'Invalid tutor ID or user is not a tutor' });
    }

    // Check if class name already exists
    const existingClass = await Class.findOne({ name });
    if (existingClass) {
      return res.status(400).json({ message: 'Class name already exists' });
    }

    // Create the class
    const newClass = new Class({
      name,
      description,
      tutor: tutorId,
      createdBy: req.user.id,
      students: []
    });

    await newClass.save();

    // Assign the class to the tutor
    tutor.classe = newClass._id;
    await tutor.save();

    // Populate tutor details for response
    await newClass.populate('tutor', 'firstName lastName email');
    await newClass.populate('createdBy', 'firstName lastName email');

    return res.status(201).json(newClass);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Add students to a class (Admin only)
exports.addStudentsToClass = async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Only admins can add students to classes' });
      }
  
      const { classId, studentIds } = req.body;
  
      // Validate class
      const classDoc = await Class.findById(classId);
      if (!classDoc) {
        return res.status(404).json({ message: 'Class not found' });
      }
  
      // Validate students
      const students = await User.find({ _id: { $in: studentIds }, userRole: 'STUDENT' });
      if (students.length !== studentIds.length) {
        return res.status(400).json({ message: 'One or more student IDs are invalid or users are not students' });
      }
  
      // Check if any student is already in another class
      for (const student of students) {
        if (student.classe && student.classe.toString() !== classId) {
          return res.status(400).json({ message: `Student ${student.email} is already assigned to another class` });
        }
      }
  
      // Add students to the class (avoid duplicates)
      classDoc.students = [...new Set([...classDoc.students, ...studentIds])];
      await classDoc.save();
  
      // Update each student's classe field
      await User.updateMany(
        { _id: { $in: studentIds } },
        { classe: classId }
      );
  
      // Get the updated class with correct counts
      const updatedClassDoc = await Class.findById(classId)
        .populate('students', 'firstName lastName email')
        .populate('tutor', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email');
  
      return res.json(updatedClassDoc);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  };
  

// Get all classes (Admin or Tutor)
exports.getAllClasses = async (req, res) => {
  try {
    let query = {};

    // Tutors can only see their assigned classes
    if (req.user.role === 'TUTOR') {
      query.tutor = req.user.id;
    }

    const classes = await Class.find(query)
      .populate('tutor', 'firstName lastName email')
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
    const classDoc = await Class.findById(req.params.id)
      .populate('tutor', 'firstName lastName email')
      .populate('students', 'firstName lastName email cin classe educationLevel')
      .populate('createdBy', 'firstName lastName email');

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Tutors can only access their own classes
    if (req.user.role === 'TUTOR' && classDoc.tutor._id.toString() !== req.user.id) {
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
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can update classes' });
    }

    const { name, description, tutorId } = req.body;

    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Update tutor if provided
    if (tutorId) {
      const newTutor = await User.findById(tutorId);
      if (!newTutor || newTutor.userRole !== 'TUTOR') {
        return res.status(400).json({ message: 'Invalid tutor ID or user is not a tutor' });
      }

      // Remove class assignment from the old tutor
      const oldTutor = await User.findById(classDoc.tutor);
      if (oldTutor) {
        oldTutor.classe = null;
        await oldTutor.save();
      }

      // Assign class to the new tutor
      newTutor.classe = classDoc._id;
      await newTutor.save();

      classDoc.tutor = tutorId;
    }

    // Update other fields
    if (name) classDoc.name = name;
    if (description) classDoc.description = description;

    await classDoc.save();

    await classDoc.populate('tutor', 'firstName lastName email');
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
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can delete classes' });
    }

    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Remove class assignment from tutor
    const tutor = await User.findById(classDoc.tutor);
    if (tutor) {
      tutor.classe = null;
      await tutor.save();
    }

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
    if (req.user.role !== 'TUTOR') {
      return res.status(403).json({ message: 'Only tutors can access this endpoint' });
    }

    // Find all classes assigned to the tutor
    const classes = await Class.find({ tutor: req.user.id });

    // Extract all student IDs from these classes
    const studentIds = classes.reduce((acc, curr) => {
      return [...acc, ...curr.students];
    }, []);

    // Remove duplicates
    const uniqueStudentIds = [...new Set(studentIds.map(id => id.toString()))];

    // Fetch student details, including accountStatus
    const students = await User.find({
      _id: { $in: uniqueStudentIds },
      userRole: 'STUDENT'
    }).select('firstName lastName email cin classe educationLevel accountStatus'); // Add accountStatus

    return res.json(students);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
exports.getProjectsForClass = async (req, res) => {
  try {
    const classId = req.params.classId;

    // Verify the class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Find projects where the classId is in the project's classes array
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
