import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // A real application would use environment variables for this
    const dbURI = 'mongodb://localhost:27017/sudoqmaestro';

    await mongoose.connect(dbURI);

    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;
