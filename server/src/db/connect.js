const mongoose = require('mongoose');

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error('MONGO_URI not found in .env file');
    }

    await mongoose.connect(uri);

    console.log('✅ MongoDB Atlas connected:', mongoose.connection.host);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB error:', err);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
