const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cakeshop');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@cakeshop.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      email: 'admin@cakeshop.com',
      passwordHash,
      name: 'Admin User',
      role: 'admin'
    });

    console.log('Admin user created successfully:');
    console.log('Email: admin@cakeshop.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    console.log('User ID:', admin._id);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createAdmin();
