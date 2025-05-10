const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

exports.assignTeamsWithAI = async (req, res) => {
    try {
        const ProjectApplication = require('../models/projectApplicationModel');
        const Project = require('../models/projectModel');

        const teams = await ProjectApplication.find()
            .populate('projectRef')
            .populate('studentRef');

        console.log("Sample teams:", teams.slice(0, 2).map(t => ({
            id: t._id,
            teamName: t.teamName,
            projectRef: t.projectRef ? {
                id: t.projectRef._id,
                name: t.projectRef.name
            } : null
        })));

        // Get projects
        const projects = await Project.find();
        console.log(`Available projects: ${projects.length}`);
        console.log("Sample projects:", projects.slice(0, 3).map(p => ({
            id: p._id,
            name: p.name
        })));

        // Generate motivational letters from teams
        let motivationalLetters = '';
        teams.forEach(team => {
            motivationalLetters += `${team.teamName}\n\n`;
            motivationalLetters += `Project: ${team.projectRef?.name || "No project"}\n`;
            motivationalLetters += team.motivationLetter || "No motivation letter provided.";
            motivationalLetters += '\n---\n';
        });

        const prompt = `
          I have ${teams.length} groups, and I need to assign teams to projects.
          
          The constraints are:
          1. Each group should be assigned to one project.
          2. Each project can have a maximum of 3 groups.
          3. Assign groups to projects based on their motivation letters.
          
          Here are the team details:
          ${motivationalLetters}
          
          Format the output as a JSON array with this structure:
          [
            {
              "teamName": "exact-team-name-without-adding-Team-prefix",
              "assignedProject": "Project Name"
            },
            ...
          ]
          
          IMPORTANT: Use the exact team names as provided in the input. Do NOT add "Team" prefix to any team name.
          Only provide the output JSON array with no additional explanation or text.
        `;

        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();
        console.log("AI Response:", aiResponse);

        // Parse the AI response
        let assignments;
        try {
            const jsonMatch = aiResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (jsonMatch) {
                assignments = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Invalid JSON format in AI response');
            }
        } catch (error) {
            console.error('Error parsing AI response:', error);
            return res.status(500).json({
                message: 'Failed to parse AI response',
                error: error.message,
                aiResponse
            });
        }

        console.log("Parsed AI assignments:", assignments);

        // Process the assignment recommendations
        const processedAssignments = [];

        for (const assignment of assignments) {
            // Clean up team name if it still has "Team " prefix
            const teamName = assignment.teamName.startsWith('Team ')
                ? assignment.teamName.substring(5)
                : assignment.teamName;

            // Get all matching teams
            const matchingTeams = teams.filter(t => t.teamName === teamName);

            if (matchingTeams.length > 0) {
                // Find the project by name
                const project = projects.find(p =>
                    p.name === assignment.assignedProject ||
                    p.name.toLowerCase() === assignment.assignedProject.toLowerCase()
                );

                if (project) {
                    processedAssignments.push({
                        teamName: teamName,
                        assignedProject: project.name,
                        projectId: project._id.toString(),
                        currentProject: matchingTeams[0].projectRef?.name || "None",
                        status: "Recommendation - Not Applied"
                    });
                } else {
                    processedAssignments.push({
                        teamName: teamName,
                        assignedProject: assignment.assignedProject,
                        error: "Project not found in database"
                    });
                }
            } else {
                processedAssignments.push({
                    teamName: teamName,
                    assignedProject: assignment.assignedProject,
                    error: "Team not found in database"
                });
            }
        }

        return res.status(200).json(processedAssignments);
    } catch (error) {
        console.error('Error in AI assignment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.submitFinalAssignment = async (req, res) => {
    try {
        const ProjectApplication = require('../models/projectApplicationModel');
        const Project = require('../models/projectModel');
        const Team = require('../models/teamModel');

        const { teamName, projectName } = req.body;

        const team = await Team.findOne({ name: teamName });
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        const project = await Project.findOne({ name: projectName });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const studentIds = team.members.map(m => m.user.toString());
        if (studentIds.length === 0) {
            return res.status(400).json({ message: 'Team has no members' });
        }

        console.log(`Processing ${studentIds.length} students in team "${teamName}"`);

        team.projectRef = project._id;
        await team.save();

        if (!project.teamRef.includes(team._id)) {
            project.teamRef.push(team._id);
            await project.save();
        }

        const bulkOps = studentIds.map(studentId => ({
            updateOne: {
                filter: {
                    studentRef: studentId,
                    projectRef: project._id
                },
                update: {
                    $set: {
                        status: 'ACCEPTED',
                        teamRef: team._id,
                        motivationLetter: 'Assigned by tutor'
                    }
                },
                upsert: true
            }
        }));

        await ProjectApplication.bulkWrite(bulkOps);

        await ProjectApplication.deleteMany({
            studentRef: { $in: studentIds },
            projectRef: { $ne: project._id }
        });

        if (req.app.get('io')) {
            req.app.get('io').emit('project_assigned', {
                teamName,
                projectName,
                teamId: team._id.toString(),
                projectId: project._id.toString()
            });
            console.log('Socket event emitted: project_assigned');
        }

        return res.status(200).json({
            message: 'Final assignment submitted successfully',
            details: `Assigned team "${teamName}" to project "${projectName}"`
        });
    } catch (error) {
        console.error('Error in final assignment submission:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getStudentProjects = async (req, res) => {
    try {
        const ProjectApplication = require('../models/projectApplicationModel');
        const studentId = req.user.id;

        const applications = await ProjectApplication.find({
            studentRef: studentId,
            status: 'ACCEPTED'
        })
            .populate('projectRef', 'name description startDate endDate status')
            .populate({
                path: 'teamName',
                select: 'teamName members',
                populate: {
                    path: 'members.user',
                    select: 'firstName lastName'
                }
            });

        const projectsMap = new Map();
        applications.forEach(app => {
            const project = {
                ...app.projectRef.toObject(),
                teams: []
            };

            if (app.teamRef) {
                project.teams.push({
                    name: app.teamRef.teamName,
                    members: app.teamRef.members.map(m => ({
                        name: `${m.user.firstName} ${m.user.lastName}`,
                        role: m.role
                    }))
                });
            }

            if (projectsMap.has(app.projectRef._id.toString())) {
                const existing = projectsMap.get(app.projectRef._id.toString());
                existing.teams = [...existing.teams, ...project.teams];
            } else {
                projectsMap.set(app.projectRef._id.toString(), project);
            }
        });

        return res.status(200).json(Array.from(projectsMap.values()));
    } catch (error) {
        console.error('Error fetching student projects:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// Controller function to assign project to team
exports.assignProjectToTeam = async (req, res) => {
    try {
        const { teamId, projectId } = req.body;

        // Find the team and assign the project
        const team = await Team.findById(teamId);
        const project = await Project.findById(projectId);

        if (!team || !project) {
            return res.status(400).json({ message: 'Invalid team or project ID' });
        }

        // Assign the project to the team
        team.projectRef = projectId;
        await team.save();

        // Return the updated team
        return res.status(200).json(team);
    } catch (error) {
        console.error('Error assigning project to team:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
