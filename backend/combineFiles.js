const fs = require('fs');
const path = require('path');

// Define the base paths for backend and frontend
const backendPath = 'C:\\Users\\Admin\\OneDrive\\forkina-FullStackProject\\forkina-FullStackProject\\backend';
const frontendPath = 'C:\\Users\\Admin\\OneDrive\\forkina-FullStackProject\\forkina-FullStackProject\\project';

// List of files to extract
const filesToExtract = [
    // Backend files
    { path: path.join(backendPath, 'models', 'classModel.js'), label: 'backend/models/classModel.js' },
    { path: path.join(backendPath, 'models', 'teamModel.js'), label: 'backend/models/teamModel.js' },
    { path: path.join(backendPath, 'models', 'userModel.js'), label: 'backend/models/userModel.js' },
    { path: path.join(backendPath, 'models', 'User.js'), label: 'backend/models/User.js' },
    { path: path.join(backendPath, 'controllers', 'teamController.js'), label: 'backend/controllers/teamController.js' },
    { path: path.join(backendPath, 'controllers', 'classController.js'), label: 'backend/controllers/classController.js' },
    { path: path.join(backendPath, 'controllers', 'userController.js'), label: 'backend/controllers/userController.js' },
    { path: path.join(backendPath, 'routes', 'teamRoutes.js'), label: 'backend/routes/teamRoutes.js' },
    { path: path.join(backendPath, 'routes', 'classRoutes.js'), label: 'backend/routes/classRoutes.js' },
    { path: path.join(backendPath, 'middlewares', 'authMiddleware.js'), label: 'backend/middlewares/authMiddleware.js' },
    { path: path.join(backendPath, 'config', 'db.js'), label: 'backend/config/db.js' },

    // Frontend files
    { path: path.join(frontendPath, 'src', 'api', 'teamApi.js'), label: 'project/src/api/teamApi.js' },
    { path: path.join(frontendPath, 'src', 'api', 'classApi.js'), label: 'project/src/api/classApi.js' },
    { path: path.join(frontendPath, 'src', 'api', 'userApi.js'), label: 'project/src/api/userApi.js' },
    { path: path.join(frontendPath, 'src', 'pages', 'student', 'TeamManagement.jsx'), label: 'project/src/pages/student/TeamManagement.jsx' },
    { path: path.join(frontendPath, 'src', 'pages', 'admin', 'ClassesManagement.jsx'), label: 'project/src/pages/admin/ClassesManagement.jsx' },
    { path: path.join(frontendPath, 'src', 'components', 'dialogs', 'UserDetailsDialog.jsx'), label: 'project/src/components/dialogs/UserDetailsDialog.jsx' },
    { path: path.join(frontendPath, 'src', 'utils', 'errorHandler.js'), label: 'project/src/utils/errorHandler.js' },
    { path: path.join(frontendPath, 'src', 'api', 'axiosConfig.js'), label: 'project/src/api/axiosConfig.js' },
];

// Output file path
const outputFile = 'combined_files.js';

// Function to extract and combine files
function combineFiles() {
    const writeStream = fs.createWriteStream(outputFile, { flags: 'w' });

    writeStream.write('=== Combined Files ===\n\n');

    filesToExtract.forEach(({ path: filePath, label }) => {
        try {
            // Check if the file exists
            if (!fs.existsSync(filePath)) {
                writeStream.write(`[ERROR] File not found: ${label}\n\n`);
                console.log(`File not found: ${filePath}`);
                return;
            }

            // Read the file content
            const content = fs.readFileSync(filePath, 'utf8');

            // Write the file label and content to the output file
            writeStream.write(`=== ${label} ===\n`);
            writeStream.write(content);
            writeStream.write('\n\n');
            console.log(`Successfully extracted: ${filePath}`);
        } catch (error) {
            writeStream.write(`[ERROR] Failed to read file: ${label}\n${error.message}\n\n`);
            console.error(`Error reading file ${filePath}:`, error.message);
        }
    });

    writeStream.write('=== End of Combined Files ===\n');
    writeStream.end();
    console.log(`All files have been combined into ${outputFile}`);
}

// Run the script
combineFiles();