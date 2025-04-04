// controllers/teamController.js
const Team = require('../models/teamModel');
const User = require('../models/userModel');
const Class = require('../models/classModel');
const Notification = require('../models/notificationModel');
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

    // Validate that all members are from the same class
    const classmates = await User.find({
      _id: { $in: memberIds },
      classe: student.classe._id,
      userRole: 'STUDENT'
    });

    if (classmates.length !== memberIds.length) {
      return res.status(400).json({ message: 'All members must be from your class' });
    }

    // Create the team
    const team = new Team({
      name,
      classRef: student.classe._id,
      createdBy: req.user.id,
      members: [
        { user: req.user.id }, // Creator is automatically a member
        ...memberIds.map(id => ({ user: id }))
      ]
    });

    await team.save();

    // Populate for response
    await team.populate('members.user', 'firstName lastName email');
    await team.populate('createdBy', 'firstName lastName email');
    await team.populate('classRef', 'name');

    return res.status(201).json(team);
  } catch (err) {
    return res.status(400).json({ error: err.message });
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
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only students can update teams' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Only the creator can update the team
    if (team.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the team creator can update the team' });
    }

    const { name, memberIds } = req.body;

    // Validate new members are classmates
    if (memberIds) {
      const student = await User.findById(req.user.id);
      const classmates = await User.find({
        _id: { $in: memberIds },
        classe: student.classe,
        userRole: 'STUDENT'
      });

      if (classmates.length !== memberIds.length) {
        return res.status(400).json({ message: 'All members must be classmates' });
      }

      // Update members
      team.members = memberIds.map(id => ({ user: id }));
      // Ensure creator remains a member
      if (!team.members.some(m => m.user.toString() === req.user.id)) {
        team.members.push({ user: req.user.id });
      }
    }

    if (name) team.name = name;

    await team.save();

    // Update teamRef for all members
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

    return res.json(team);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only students can delete teams' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Only the creator can delete the team
    if (team.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the team creator can delete the team' });
    }

    // Remove teamRef from all members
    await User.updateMany(
        { teamRef: team._id },
        { $unset: { teamRef: 1 } }
    );

    await Team.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Team deleted successfully' });
  } catch (err) {
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
      console.log('Before update - confirmed:', team.confirmed); // Debug log
      team.confirmed = true;
      await team.save();
      console.log('After update - confirmed:', team.confirmed); // Debug log

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
        .populate('classRef', 'name');

    return res.json(teams);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
        .populate('projectRef')
        .populate('members.user', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .populate('classRef', 'name');

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Students can only see their own teams
    if (req.user.role === 'STUDENT' &&
        !team.members.some(m => m.user.toString() === req.user.id)) {
      return res.status(403).json({ message: 'You do not have access to this team' });
    }

    return res.json(team);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.assignProjectToTeam = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can assign projects to teams' });
    }

    const { teamId, projectId } = req.body;

    // Validate team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Validate project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Assign the project to the team
    team.projectRef = projectId;
    await team.save();

    // Populate for response
    await team.populate('projectRef', 'name');
    await team.populate('members.user', 'firstName lastName email');
    await team.populate('createdBy', 'firstName lastName email');
    await team.populate('classRef', 'name');

    return res.json(team);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};