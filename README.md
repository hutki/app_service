# Equipment Request Registration Web Application

This is a full-stack web application for registering equipment requests with features for file attachments, acceptance photos, and user messaging.

## Features

- User authentication and role-based access control
- Equipment request tickets with unique numbers and descriptions
- File attachments for technical specifications
- Acceptance photos for equipment verification
- User messaging system for communication
- Responsive design for various devices

## Technology Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JSON Web Tokens (JWT) for authentication
- Multer for file uploads

### Frontend
- React with React Router
- Material-UI (MUI) for UI components
- Axios for HTTP requests

## Project Structure

```
equipment-request-app/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── utils/
│   ├── server.js
│   └── package.json
└── frontend/
    ├── public/
    └── src/
        ├── components/
        ├── context/
        ├── pages/
        ├── services/
        ├── utils/
        ├── App.js
        └── index.js
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or cloud instance)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install backend dependencies:
   ```bash
   cd equipment-request-app/backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

4. Configure environment variables:
   - Create a `.env` file in the backend directory based on the provided `.env.example`
   - Update the `MONGO_URI` with your MongoDB connection string
   - Set a strong `JWT_SECRET` for token encryption

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

### Tickets
- GET `/api/tickets` - Get all tickets
- GET `/api/tickets/:id` - Get ticket by ID
- POST `/api/tickets` - Create new ticket
- PUT `/api/tickets/:id` - Update ticket
- DELETE `/api/tickets/:id` - Delete ticket
- POST `/api/tickets/:id/attachments` - Add attachment to ticket
- POST `/api/tickets/:id/photos` - Add acceptance photo to ticket

### Messages
- GET `/api/messages/:ticketId` - Get messages for a ticket
- POST `/api/messages` - Send a new message
- POST `/api/messages/:id/attachments` - Add attachment to message

### Files
- GET `/api/files/:filename` - Download a file

## User Roles

- **Admin**: Full access to all features and user management
- **Manager**: Can manage tickets and assign to engineers
- **Engineer**: Can update ticket status and add acceptance photos
- **Client**: Can create tickets and communicate via messages

## Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- File uploads are sanitized and validated
- Role-based access control implemented
- CORS is configured for security

## Future Enhancements

- Real-time notifications using WebSockets
- Email notifications for important updates
- Advanced reporting and analytics
- Mobile application version
- Integration with inventory management systems