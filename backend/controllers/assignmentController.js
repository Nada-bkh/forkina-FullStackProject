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

        const { teamName, projectName } = req.body;

        if (!teamName || !projectName) {
            return res.status(400).json({ message: 'Team name and project name are required' });
        }

        console.log(`Assigning team "${teamName}" to project "${projectName}"`);

        // Find the project
        const project = await Project.findOne({ name: projectName });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Get all unique student IDs in the team
        const studentIds = await ProjectApplication.distinct('studentRef', { teamName });
        if (studentIds.length === 0) {
            return res.status(404).json({ message: 'No students found in this team' });
        }

        console.log(`Processing ${studentIds.length} students in team "${teamName}"`);

        // Process each student in the team
        for (const studentId of studentIds) {
            // Check for existing application to this project
            const existingApp = await ProjectApplication.findOne({
                studentRef: studentId,
                projectRef: project._id
            });

            if (existingApp) {
                // Update existing application to ACCEPTED
                console.log(`Updating existing application ${existingApp._id} for student ${studentId}`);
                await ProjectApplication.findByIdAndUpdate(
                    existingApp._id,
                    { status: 'ACCEPTED' },
                    { new: true }
                );
            } else {
                // Create new application
                console.log(`Creating new application for student ${studentId} on project ${project._id}`);
                await ProjectApplication.create({
                    studentRef: studentId,
                    projectRef: project._id,
                    teamName: teamName,
                    status: 'ACCEPTED',
                    motivationLetter: 'Assigned by tutor', // Set default or required fields
                    priority: 1 // Adjust as needed
                });
            }

            // Delete all other applications for this student to other projects
            const deleteResult = await ProjectApplication.deleteMany({
                studentRef: studentId,
                projectRef: { $ne: project._id }
            });
            console.log(`Deleted ${deleteResult.deletedCount} old applications for student ${studentId}`);
        }

        return res.status(200).json({
            message: 'Final assignment submitted successfully',
            details: `Assigned ${studentIds.length} students in team "${teamName}" to project "${projectName}"`
        });
    } catch (error) {
        console.error('Error in final assignment submission:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};