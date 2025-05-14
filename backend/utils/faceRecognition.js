const faceapi = require('face-api.js');
const canvas = require('canvas');
const fs = require('fs');
const path = require('path');

// Initialize the canvas environment for face-api.js
const { Canvas, Image, loadImage } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData: canvas.ImageData });

// Path to the models
const MODELS_PATH = path.join(__dirname, '../models');

// Load required models
let modelsLoaded = false;
async function loadModels() {
  if (modelsLoaded) return;
  
  // Ensure models directory exists
  if (!fs.existsSync(MODELS_PATH)) {
    fs.mkdirSync(MODELS_PATH, { recursive: true });
  }
  
  try {
    // Set the models path and load the models
    const modelPathSsdMobilenetv1 = path.join(MODELS_PATH, 'ssd_mobilenetv1_model-weights_manifest.json');
    const modelPathFaceLandmark68 = path.join(MODELS_PATH, 'face_landmark_68_model-weights_manifest.json');
    const modelPathFaceRecognition = path.join(MODELS_PATH, 'face_recognition_model-weights_manifest.json');
    
    // Check if models exist, if not use remote models for the first run
    const modelOptions = { 
      outputPath: MODELS_PATH 
    };
    
    // Load models from the server or web
    console.log('Loading face recognition models...');
    
    // For simplicity in this example, we'll load from urls rather than local files
    // In production, you should download these models and load them locally
    await faceapi.nets.ssdMobilenetv1.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
    
    console.log('Face recognition models loaded successfully');
    modelsLoaded = true;
  } catch (error) {
    console.error('Error loading face recognition models:', error);
    throw error;
  }
}

// Extract face descriptor from an image
async function getFaceDescriptor(imagePath) {
  try {
    // Ensure models are loaded
    await loadModels();
    
    // Load the image
    const img = await loadImage(imagePath);
    
    // Detect all faces and compute descriptors
    const detections = await faceapi
      .detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    if (detections.length === 0) {
      console.log('No faces detected in the image');
      return null;
    }
    
    if (detections.length > 1) {
      console.log('Multiple faces detected, using the first one');
    }
    
    // Return the descriptor of the first face
    return detections[0].descriptor;
  } catch (error) {
    console.error('Error getting face descriptor:', error);
    return null;
  }
}

// Compare two face descriptors and return similarity score
function compareFaceDescriptors(descriptor1, descriptor2) {
  if (!descriptor1 || !descriptor2) {
    return { match: false, distance: Infinity };
  }
  
  // Calculate Euclidean distance
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  
  // Threshold for determining a match (lower is better)
  // Values around 0.5-0.6 are good thresholds for face recognition
  const threshold = 0.6;
  
  return {
    match: distance < threshold,
    distance,
    similarity: 1 - distance // Convert to similarity score (0-1)
  };
}

module.exports = {
  loadModels,
  getFaceDescriptor,
  compareFaceDescriptors
}; 