const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Modern mongoose options are defaults, kept clean and extensible
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Connection Failed: ${error.message}`);
    // Exit process with failure to prevent operating in an unpersisted, insecure state
    process.exit(1);
  }
};

module.exports = connectDB;
