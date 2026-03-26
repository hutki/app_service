const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./backend/models/User');
const Ticket = require('./backend/models/Ticket');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/equipment-request-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Sample data
const sampleUsers = [
  {
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    username: 'manager',
    email: 'manager@example.com',
    password: 'manager123',
    role: 'manager'
  },
  {
    username: 'engineer',
    email: 'engineer@example.com',
    password: 'engineer123',
    role: 'engineer'
  },
  {
    username: 'client',
    email: 'client@example.com',
    password: 'client123',
    role: 'client'
  }
];

const sampleTickets = [
  {
    ticketNumber: 'T20230101-1001',
    description: 'Request for new laptop for development team',
    status: 'new'
  },
  {
    ticketNumber: 'T20230102-1002',
    description: 'Replace broken monitor in conference room',
    status: 'in progress'
  },
  {
    ticketNumber: 'T20230103-1003',
    description: 'Upgrade server hardware for better performance',
    status: 'completed'
  }
];

// Initialize database
const initDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Ticket.deleteMany({});

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const user = new User({
        ...userData,
        password: hashedPassword
      });

      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`Created user: ${savedUser.username}`);
    }

    // Create tickets
    const ticketsData = sampleTickets.map((ticket, index) => ({
      ...ticket,
      createdBy: createdUsers[3]._id, // Assign to client user
      assignedTo: index < 2 ? createdUsers[1]._id : null // Assign first two to manager
    }));

    const createdTickets = await Ticket.insertMany(ticketsData);
    console.log(`Created ${createdTickets.length} tickets`);

    console.log('Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initDatabase();