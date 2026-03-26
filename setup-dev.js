const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Setting up development environment for Equipment Request App...\n');

// Check if MongoDB is installed
exec('mongod --version', (error, stdout, stderr) => {
  if (error) {
    console.log('MongoDB is not installed or not in PATH.');
    console.log('Please install MongoDB before proceeding:');
    console.log('https://docs.mongodb.com/manual/installation/\n');
  } else {
    console.log('MongoDB is installed.');
    console.log(stdout);
  }

  // Check if Node.js is installed
  exec('node --version', (error, stdout, stderr) => {
    if (error) {
      console.log('Node.js is not installed.');
      console.log('Please install Node.js before proceeding:');
      console.log('https://nodejs.org/\n');
      return;
    }

    console.log('Node.js is installed.');
    console.log(stdout);

    // Check if npm is installed
    exec('npm --version', (error, stdout, stderr) => {
      if (error) {
        console.log('npm is not installed.');
        return;
      }

      console.log('npm is installed.');
      console.log(stdout);

      // Install backend dependencies
      console.log('Installing backend dependencies...');
      exec('cd backend && npm install', (error, stdout, stderr) => {
        if (error) {
          console.log('Error installing backend dependencies:');
          console.log(error);
          return;
        }

        console.log('Backend dependencies installed successfully.');

        // Install frontend dependencies
        console.log('Installing frontend dependencies...');
        exec('cd frontend && npm install', (error, stdout, stderr) => {
          if (error) {
            console.log('Error installing frontend dependencies:');
            console.log(error);
            return;
          }

          console.log('Frontend dependencies installed successfully.');

          // Create .env file if it doesn't exist
          const envPath = path.join(__dirname, 'backend', '.env');
          if (!fs.existsSync(envPath)) {
            const envContent = `
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/equipment-request-app
JWT_SECRET=equipmentrequestsecret
            `.trim();

            fs.writeFileSync(envPath, envContent);
            console.log('.env file created successfully.');
          }

          console.log('\nSetup completed successfully!');
          console.log('\nTo run the application:');
          console.log('1. Start MongoDB server (if not already running)');
          console.log('2. Run "npm run dev" in the backend directory');
          console.log('3. Run "npm start" in the frontend directory');
          console.log('4. Visit http://localhost:3000 in your browser');
        });
      });
    });
  });
});