# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your backend code into the container
COPY . .

# Expose port 8080 (or whatever port your backend listens to)
EXPOSE 8080

# Start the backend app
CMD ["npm", "start"]
