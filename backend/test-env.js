require('dotenv').config();

console.log('Current directory:', __dirname);
console.log('Environment variables:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);
console.log('COOKIE_KEY:', process.env.COOKIE_KEY);
console.log('CLIENT_URL:', process.env.CLIENT_URL); 