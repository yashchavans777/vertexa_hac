const mongoose = require("mongoose");
const { DB_NAME } = require("../constants");

/**
 * Establishes a persistent connection to MongoDB.
 * Separating DB connection from server startup allows graceful handling
 * of connection failures before the HTTP server begins accepting traffic.
 */
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MONGODB connection FAILED:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
