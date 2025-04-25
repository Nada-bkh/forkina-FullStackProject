// controllers/teamController.js
const mongoose = require('mongoose'); // Ajouter cette ligne
const Team = require('../models/teamModel');
const User = require('../models/userModel');
const Class = require('../models/classModel');
const Evaluation = require('../models/evaluationModel'); // Ajouter cette ligne
const Notification = require('../models/notificationModel');
const Project = require('../models/projectModel');

exports.createTeam = async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only students can create teams' });
    }
    const { name, memberIds } = req.body;
    const student = await User.findById(req.user.id).populate('classe');
    if (!student.classe) {
      return res.status(400).json({ message: 'You must be assigned to a class to create a team' });
    }
    const classmates = await User.find({
      _id: { $in: memberIds },
      classe: student.classe._id,
      userRole: 'STUDENT'
    });
    if (classmates.length !== memberIds.length) {
      return res.status(400).json({ message: 'All members must be from your class' });
    }
    const team = new Team({
      name,
      classRef: student.classe._id,
      createdBy: req.user.id,
      members: [{ user: req.user.id }, ...memberIds.map(id => ({ user: id }))]
    });
    await team.save();
    await team.populate('members.user', 'firstName lastName email');
    await team.populate('createdBy', 'firstName lastName email');
    await team.populate('classRef', 'name');
    return res.status(201).json(team);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
exports.getTeamsByTutorId = async (req, res) => {
  try {
    if (!req.params.idTutor) {
      return res.status(400).json({ 
        success: false,
        message: 'Tutor ID is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.idTutor)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid tutor ID'
      });
    }

    // Récupérer les équipes avec population de l'évaluation
    const teams = await Team.find({ tutor: req.params.idTutor })
      .populate('projectRef', 'name description')
      .populate('classRef', 'name')
      .populate('members.user', 'firstName lastName email')
      .populate('tutor', 'firstName lastName email')
      .populate('evaluation') // Ajoutez cette ligne
      .lean();

    if (!teams?.length) {
      return res.status(404).json({ 
        success: false,
        message: 'No teams found for this tutor'
      });
    }

    res.json({ success: true, data: teams });
  } catch (err) {
    console.error('Error fetching teams:', err.stack);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
}

exports.getTeamEvaluationPage = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members.user')
      .populate('projectRef')
      .populate('classRef');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.status(200).json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getStudentTeams = async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only students can view their teams' });
    }

    const teams = await Team.find({ 'members.user': req.user.id })
        .populate('members.user', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .populate('classRef', 'name');

    return res.json(teams);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only students or admins can update teams' });
    }
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    // Only enforce creator check for students
    if (req.user.role === 'STUDENT' && team.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the team creator can update the team' });
    }
    const { name, memberIds, tutor } = req.body; // Use 'tutor' to match schema
    if (memberIds) {
      const classmates = await User.find({
        _id: { $in: memberIds },
        classe: team.classRef,
        userRole: 'STUDENT'
      });
      if (classmates.length !== memberIds.length) {
        return res.status(400).json({ message: 'All members must be from the team\'s class' });
      }
      team.members = memberIds.map(id => ({ user: id }));
      if (req.user.role === 'STUDENT' && !team.members.some(m => m.user.toString() === req.user.id)) {
        team.members.push({ user: req.user.id });
      }
    }
    if (name) team.name = name;
    // Handle tutor assignment (admin-only)
    if (tutor && req.user.role === 'ADMIN') {
      const tutorUser = await User.findById(tutor);
      if (!tutorUser || tutorUser.userRole !== 'TUTOR') {
        return res.status(400).json({ message: 'Invalid tutor ID or user is not a tutor' });
      }
      team.tutor = tutor;
    }
    await team.save();
    await User.updateMany(
        { teamRef: team._id },
        { $unset: { teamRef: 1 } }
    );
    await User.updateMany(
        { _id: { $in: team.members.map(m => m.user) } },
        { teamRef: team._id }
    );
    await team.populate('members.user', 'firstName lastName email');
    await team.populate('createdBy', 'firstName lastName email');
    await team.populate('classRef', 'name');
    await team.populate('tutor', 'firstName lastName email'); // Populate tutor
    return res.json(team);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    console.log(`deleteTeam called with teamId: ${req.params.id}`);
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only admins or students can delete teams' });
    }
    if (req.user.role === 'STUDENT' && team.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the team creator can delete the team' });
    }

    await User.updateMany(
        { teamRef: team._id },
        { $unset: { teamRef: 1 } }
    );

    await Team.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Team deleted successfully' });
  } catch (err) {
    console.error(`Error in deleteTeam for teamId ${req.params.id}:`, err);
    return res.status(500).json({ error: err.message });
  }
};

exports.confirmOrDeleteTeam = async (req, res) => {
  try {
    if (req.user.role !== 'TUTOR') {
      return res.status(403).json({ message: 'Only tutors can confirm or delete teams' });
    }

    const { teamId, action } = req.body;
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const classData = await Class.findById(team.classRef).populate('tutor');
    if (classData.tutor._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not the tutor for this team’s class' });
    }

    const memberIds = team.members.map((m) => m.user);

    if (action === 'confirm') {
      console.log('Before update - confirmed:', team.confirmed);
      team.confirmed = true;
      await team.save();
      console.log('After update - confirmed:', team.confirmed);

      const tutorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();
      const message = `Your team "${team.name}" has been confirmed by your tutor, ${tutorName}.`;

      const notifications = memberIds.map((userId) => ({
        user: userId,
        message,
      }));
      await Notification.insertMany(notifications);

      await team.populate('members.user', 'firstName lastName email');
      await team.populate('createdBy', 'firstName lastName email');
      await team.populate('classRef', 'name');
      return res.json({ message: 'Team confirmed successfully', team });
    } else if (action === 'delete') {
      const tutorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();
      const message = `Your team "${team.name}" has been deleted by your tutor, ${tutorName}.`;

      const notifications = memberIds.map((userId) => ({
        user: userId,
        message,
      }));
      await Notification.insertMany(notifications);

      await User.updateMany(
          { teamRef: team._id },
          { $unset: { teamRef: 1 } }
      );
      await Team.findByIdAndDelete(teamId);
      return res.json({ message: 'Team deleted successfully' });
    } else {
      return res.status(400).json({ message: 'Invalid action. Use "confirm" or "delete"' });
    }
  } catch (err) {
    console.error('Error in confirmOrDeleteTeam:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

exports.getAllTeams = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can view all teams' });
    }

    const teams = await Team.find()
        .populate('members.user', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .populate('classRef', 'name')
        .populate('tutor', 'firstName lastName email'); // Added this line to populate tutor

    console.log('Fetched teams:', teams.map(t => t._id));
    return res.json(teams);
  } catch (err) {
    console.error('Error in getAllTeams:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
        .populate('projectRef')
        .populate('members.user', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .populate('classRef', 'name')
        .populate('evaluation');

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (req.user.role === 'STUDENT' &&
        !team.members.some(m => m.user.toString() === req.user.id)) {
      return res.status(403).json({ message: 'You do not have access to this team' });
    }

    return res.json(team);
  } catch (err) {
    console.error(`Error in getTeamById for teamId ${req.params.id}:`, err);
    return res.status(500).json({ error: err.message });
  }
};

exports.assignProjectToTeam = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can assign projects to teams' });
    }

    const { teamId, projectId } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    team.projectRef = projectId;
    await team.save();

    await team.populate('projectRef', 'name');
    await team.populate('members.user', 'firstName lastName email');
    await team.populate('createdBy', 'firstName lastName email');
    await team.populate('classRef', 'name');

    return res.json(team);
  } catch (err) {
    console.error('Error in assignProjectToTeam:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.getTutorsByClass = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can fetch tutors' });
    }
    const classId = req.query.classId;
    if (!classId) {
      return res.status(400).json({ message: 'Class ID is required' });
    }
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({ message: 'Class not found' });
    }
    const tutors = await User.find({ userRole: 'TUTOR' });
    console.log(`Fetched tutors for class ${classId}:`, tutors.length);
    return res.json(tutors);
  } catch (err) {
    console.error(`Error in getTutorsByClass for classId ${req.query.classId}:`, err);
    return res.status(500).json({ error: err.message });
  }
};

exports.getStudentsByClass = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can fetch students' });
    }
    const classId = req.query.classId;
    if (!classId) {
      return res.status(400).json({ message: 'Class ID is required' });
    }
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({ message: 'Class not found' });
    }
    const students = await User.find({ classe: classId, userRole: 'STUDENT' });
    console.log(`Fetched students for class ${classId}:`, students.length);
    return res.json(students);
  } catch (err) {
    console.error(`Error in getStudentsByClass for classId ${req.query.classId}:`, err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createTeam: exports.createTeam,
  getStudentTeams: exports.getStudentTeams,
  updateTeam: exports.updateTeam,
  deleteTeam: exports.deleteTeam,
  confirmOrDeleteTeam: exports.confirmOrDeleteTeam,
  getAllTeams: exports.getAllTeams,
  getTeamById: exports.getTeamById,
  assignProjectToTeam: exports.assignProjectToTeam,
  getTutorsByClass: exports.getTutorsByClass,
  getStudentsByClass: exports.getStudentsByClass,
  getTeamsByTutorId: exports.getTeamsByTutorId,
  getTeamEvaluationPage: exports.getTeamEvaluationPage

};