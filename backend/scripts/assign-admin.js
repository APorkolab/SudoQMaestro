import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import User from '../models/user.model.js';

const assignAdminRole = async () => {
  // Get the email address from the command-line arguments
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: node scripts/assign-admin.js <user-email>');
    process.exit(1);
  }

  try {
    // Connect to the database
    await connectDB();
    console.log('MongoDB Connected...');

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`Error: User with email "${email}" not found.`);
      // We don't want to exit with an error code here, just inform the user.
      // But for a script, exiting with 1 is appropriate.
      process.exit(1);
    }

    // Check if the user is already an admin
    if (user.role === 'admin') {
      console.log(`User ${user.displayName} (${user.email}) is already an admin.`);
      process.exit(0);
    }

    // Update the user's role to 'admin'
    user.role = 'admin';
    await user.save();

    console.log(`Successfully assigned admin role to user: ${user.displayName} (${user.email})`);

  } catch (err) {
    console.error('An error occurred:', err.message);
    process.exit(1);
  } finally {
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');
    process.exit(0);
  }
};

assignAdminRole();
