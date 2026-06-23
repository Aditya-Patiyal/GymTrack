import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const email = 'aditya.patiyal007@gmail.com';
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log('Super Admin already exists.');
      // If it exists but role is not super_admin, update it
      if (existingAdmin.role !== 'super_admin') {
        existingAdmin.role = 'super_admin';
        existingAdmin.status = 'active';
        await existingAdmin.save();
        console.log('Updated existing user to super_admin.');
      }
    } else {
      // Create new super admin
      const admin = new User({
        name: 'Super Admin',
        email,
        password: 'Password123!', // Change this after logging in
        role: 'super_admin',
        status: 'active',
        gymName: 'Platform Administration',
      });
      await admin.save();
      console.log('Super Admin created successfully.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding super admin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
