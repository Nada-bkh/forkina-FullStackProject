const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Configuration - adjusted to work when executed from the backend directory
const config = {
    rootDir: process.cwd(), // Current working directory (your backend folder)
    outputFile: 'backend_export.txt',
    backendDirs: [
        'models',
        'controllers',
        'routes',
        'middlewares',
        'config',
        'utils'
    ],
    filesToInclude: [
        'app.js',
        '.env',
        'package.json',
        'test-env.js'
    ],
    fileExtensions: ['.js', '.json', '.env', '.ts']
};

// Helper function to check if we should process this file
function shouldProcessFile(filePath) {
    const ext = path.extname(filePath);
    const basename = path.basename(filePath);

    // Check if it's in our explicitly included files
    if (config.filesToInclude.includes(basename)) {
        return true;
    }

    // Check if it has one of our target extensions
    return config.fileExtensions.includes(ext);
}

// Function to recursively get all files in a directory
function getAllFiles(dirPath, arrayOfFiles = []) {
    if (!fs.existsSync(dirPath)) {
        console.log(`Directory does not exist: ${dirPath}`);
        return arrayOfFiles;
    }

    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const filePath = path.join(dirPath, file);

        if (fs.statSync(filePath).isDirectory()) {
            // Skip node_modules, .git directories, and uploads directory
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build' && file !== 'uploads') {
                arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
            }
        } else {
            if (shouldProcessFile(filePath)) {
                arrayOfFiles.push(filePath);
            }
        }
    });

    return arrayOfFiles;
}

// Function to write file content to our output
function writeFileContent(outputStream, filePath) {
    const relativePath = path.relative(config.rootDir, filePath);
    const separator = '='.repeat(80);

    outputStream.write(`\n${separator}\n`);
    outputStream.write(`FILE: ${relativePath}\n`);
    outputStream.write(`${separator}\n\n`);

    // Handle .env files specially to mask sensitive values
    if (path.basename(filePath) === '.env' || path.basename(filePath) === 'test-env.js') {
        try {
            if (path.basename(filePath) === '.env') {
                const envConfig = dotenv.parse(fs.readFileSync(filePath));
                for (const key in envConfig) {
                    if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD') || key.includes('TOKEN')) {
                        outputStream.write(`${key}=****REDACTED****\n`);
                    } else {
                        outputStream.write(`${key}=${envConfig[key]}\n`);
                    }
                }
            } else {
                // For test-env.js, just write but with a warning
                outputStream.write("// NOTE: This might contain sensitive information\n");
                outputStream.write(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (err) {
            outputStream.write(`Error processing environment file: ${err.message}\n`);
            outputStream.write(fs.readFileSync(filePath, 'utf8'));
        }
    } else {
        // For all other files, just write the content
        outputStream.write(fs.readFileSync(filePath, 'utf8'));
    }
}

// Main function
async function exportBackend() {
    console.log('Starting backend export...');

    const outputStream = fs.createWriteStream(config.outputFile);

    // Write header information
    outputStream.write('MERN BACKEND EXPORT\n');
    outputStream.write(`Date: ${new Date().toISOString()}\n`);
    outputStream.write(`Project Structure: ${config.rootDir}\n`);
    outputStream.write('='.repeat(80) + '\n\n');

    try {
        // Process specific backend directories
        for (const dir of config.backendDirs) {
            const dirPath = path.join(config.rootDir, dir);

            if (fs.existsSync(dirPath)) {
                console.log(`Processing directory: ${dir}`);
                const files = getAllFiles(dirPath);

                for (const file of files) {
                    console.log(`Exporting: ${file}`);
                    writeFileContent(outputStream, file);
                }
            } else {
                console.log(`Directory not found: ${dir}`);
            }
        }

        // Process specific files at backend root
        for (const file of config.filesToInclude) {
            const filePath = path.join(config.rootDir, file);

            if (fs.existsSync(filePath)) {
                console.log(`Exporting: ${file}`);
                writeFileContent(outputStream, file);
            } else {
                console.log(`File not found: ${file}`);
            }
        }

        outputStream.end();
        console.log(`Backend export completed successfully! File saved to: ${config.outputFile} in the backend directory.`);
    } catch (error) {
        console.error('Error during export:', error);
        outputStream.end();
    }
}

// Run the export
exportBackend();