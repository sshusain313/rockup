const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// MongoDB connection string
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/mockey';

// Admin user details - you can change these as needed
const adminUser = {
  name: 'Admin User',
  email: 'admin@mockey.com',
  password: 'admin123', // This will be hashed before saving
  role: 'admin'
};

// Define the User schema (must match your actual User model)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
  },
  password: {
    type: String,
  },
  image: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the User model
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      if (existingAdmin.role !== 'admin') {
        // Update role to admin if it's not already
        await User.updateOne({ email: adminUser.email }, { role: 'admin' });
        console.log('Updated existing user to admin role');
      }
    } else {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminUser.password, salt);

      // Create new admin user
      const newAdmin = await User.create({
        ...adminUser,
        password: hashedPassword
      });

      console.log('Admin user created successfully');
      console.log('Email:', adminUser.email);
      console.log('Password:', adminUser.password, '(unhashed)');
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Run the function
createAdminUser();
