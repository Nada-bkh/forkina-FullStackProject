import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - adjusted for frontend project structure
const config = {
    rootDir: process.cwd(), // Current directory (project folder)
    outputFile: 'frontend_export.txt',
    frontendDirs: [
        'src/api',
        'src/components',
        'src/context',
        'src/pages',
        'src/utils',
        'src/config'
    ],
    filesToInclude: [
        'src/App.jsx',
        'src/main.jsx',
        'src/App.css',
        'src/index.css',
        '.env',
        'package.json',
        'vite.config.js',
        'tailwind.config.js',
        'postcss.config.js',
        'index.html'
    ],
    // Focus on code files, exclude images, fonts, etc.
    fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json', '.env', '.md']
};

// Helper function to check if we should process this file
function shouldProcessFile(filePath) {
    const ext = path.extname(filePath);
    const basename = path.basename(filePath);

    // Skip large binary files, manifests in model directories, etc.
    if (filePath.includes('node_modules') ||
        filePath.includes('/public/models/') ||
        basename === '.DS_Store') {
        return false;
    }

    // Check if it's in our explicitly included files
    if (config.filesToInclude.includes(filePath.replace(config.rootDir + path.sep, ''))) {
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
            // Skip node_modules, .git directories, etc.
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build') {
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
    if (path.basename(filePath) === '.env') {
        try {
            const envConfig = dotenv.parse(fs.readFileSync(filePath));
            for (const key in envConfig) {
                if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD') || key.includes('TOKEN') || key.includes('API')) {
                    outputStream.write(`${key}=****REDACTED****\n`);
                } else {
                    outputStream.write(`${key}=${envConfig[key]}\n`);
                }
            }
        } catch (err) {
            outputStream.write(`Error processing .env file: ${err.message}\n`);
            outputStream.write(fs.readFileSync(filePath, 'utf8'));
        }
    } else {
        // For all other files, just write the content
        try {
            outputStream.write(fs.readFileSync(filePath, 'utf8'));
        } catch (err) {
            outputStream.write(`Error reading file (might be binary): ${err.message}\n`);
        }
    }
}

// Main function
async function exportFrontend() {
    console.log('Starting frontend export...');

    const outputStream = fs.createWriteStream(config.outputFile);

    // Write header information
    outputStream.write('REACT FRONTEND EXPORT\n');
    outputStream.write(`Date: ${new Date().toISOString()}\n`);
    outputStream.write(`Project Structure: ${config.rootDir}\n`);
    outputStream.write('='.repeat(80) + '\n\n');

    try {
        // Process specific frontend directories
        for (const dir of config.frontendDirs) {
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

        // Process specific files
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
        console.log(`Frontend export completed successfully! File saved to: ${config.outputFile}`);
    } catch (error) {
        console.error('Error during export:', error);
        outputStream.end();
    }
}

// Run the export
exportFrontend();