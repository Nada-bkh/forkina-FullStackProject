const fs = require('fs').promises;
const path = require('path');

// List of files to export (relative paths from the project root)
const filesToExport = [
    // Backend files
    'backend/models/projectModel.js',
    'backend/controllers/projectController.js',
    'backend/routes/projectRoutes.js',
    // Frontend files
    'project/src/api/projectApi.js',
    'project/src/pages/tutor/ProjectCreate.jsx',
    'project/src/pages/admin/ProjectsManagement.jsx',
    'project/src/pages/admin/AdminProjectEdit.jsx',
];

// Output file path
const outputFile = 'exported_files.txt';

// Function to export files
async function exportFilesToTxt() {
    try {
        // Clear the output file if it exists, or create a new one
        await fs.writeFile(outputFile, '');

        // Iterate over each file
        for (const filePath of filesToExport) {
            try {
                // Read the file content
                const content = await fs.readFile(filePath, 'utf8');

                // Format the file content with a header and separator
                const fileHeader = `\n\n===== FILE: ${filePath} =====\n\n`;
                const fileFooter = `\n===== END OF FILE: ${filePath} =====\n\n`;

                // Append the file content to the output file
                await fs.appendFile(outputFile, fileHeader + content + fileFooter);
                console.log(`Successfully exported: ${filePath}`);
            } catch (err) {
                console.error(`Error reading file ${filePath}: ${err.message}`);
                // Append an error message to the output file
                await fs.appendFile(outputFile, `\n\n===== ERROR: Failed to read ${filePath} =====\n${err.message}\n\n`);
            }
        }

        console.log(`All files have been exported to ${outputFile}`);
    } catch (err) {
        console.error(`Error during export: ${err.message}`);
    }
}

// Run the script
exportFilesToTxt();