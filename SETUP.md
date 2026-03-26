# Equipment Request Registration Web Application - Setup Guide

## Prerequisites

Before running the application, ensure you have the following installed:
1. Node.js (v14 or higher)
2. MongoDB Community Edition

## Installation Steps

1. **Install MongoDB** (if not already installed):
   - Visit https://www.mongodb.com/try/download/community
   - Follow the installation instructions for your operating system
   - Start the MongoDB service

2. **Clone or download the project files**

3. **Run the automated setup**:
   ```bash
   node setup-dev.js
   ```

   This script will:
   - Verify Node.js and MongoDB installations
   - Install all backend and frontend dependencies
   - Create necessary configuration files

## Running the Application

### Option 1: Separate terminals (recommended for development)

1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend development server** (in a new terminal):
   ```bash
   cd frontend
   npm start
   ```

### Option 2: Using concurrently (single command)

From the root project directory:
```bash
npm run dev
```

This will start both the backend and frontend servers simultaneously.

## Default User Accounts

After running the application for the first time, you can use these default accounts:

| Username | Password    | Role    |
|----------|-------------|---------|
| admin    | admin123    | Admin   |
| manager  | manager123  | Manager |
| engineer | engineer123 | Engineer|
| client   | client123   | Client  |

## Initializing Sample Data

To populate the database with sample tickets and messages:

1. Ensure the backend server is running
2. Run the initialization script:
   ```bash
   cd backend
   npm run init-db
   ```

## Accessing the Application

Once both servers are running:
- Open your browser and navigate to `http://localhost:3000`
- Log in with one of the default accounts
- Start creating equipment requests and managing tickets

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB service is running
- Check the MONGO_URI in `backend/.env` file
- Verify MongoDB is accessible on localhost:27017

### Port Conflicts
- The backend runs on port 5000 by default
- The frontend runs on port 3000 by default
- If these ports are in use, update the PORT variables in the respective .env files

### Dependency Installation Failures
- Delete node_modules folders in both frontend and backend directories
- Run `npm install` in both directories separately
- Ensure you have a stable internet connection

## File Storage

Uploaded files (attachments and photos) are stored in the `backend/uploads/` directory. This directory is:
- Automatically created when you upload files
- Excluded from version control via .gitignore
- Configured as writable by the application

## Security Notes

- JWT secrets should be changed in production
- File upload sizes are limited to 10MB per file
- Passwords are securely hashed using bcrypt
- HTTPS should be used in production environments