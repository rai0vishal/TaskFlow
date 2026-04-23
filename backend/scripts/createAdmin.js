const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
  const email = process.argv[2];
  const password = process.argv[3] || 'admin123456';
  const name = process.argv[4] || 'Admin User';

  if (!email) {
    console.error('Please provide an email: node createAdmin.js <email> [password] [name]');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      console.log(`User ${email} already exists. Promoting to admin...`);
      user.role = 'admin';
      await user.save();
      console.log('User promoted successfully.');
    } else {
      console.log(`Creating new admin user: ${email}...`);
      user = await User.create({
        name,
        email,
        password, // Password will be hashed by User model pre-save hook
        role: 'admin'
      });
      console.log('Admin user created successfully.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
