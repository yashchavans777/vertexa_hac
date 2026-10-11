const mongoose = require("mongoose");
const { DB_NAME } = require("../constants");

// ANSI color formatting for terminal diagnostics
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

/**
 * Establishes a persistent, resilient connection to MongoDB.
 * Ensures IPv4 binding and explicit timeout handling to fail fast
 * if the database daemon is inactive.
 */
const connectDB = async () => {
  const baseUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
  const connectionString = baseUri.endsWith(`/${DB_NAME}`)
    ? baseUri
    : `${baseUri.replace(/\/$/, "")}/${DB_NAME}`;

  try {
    const connectionInstance = await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(
      `\n${GREEN}${BOLD}✔ MongoDB Connected Successfully !!${RESET}`
    );
    console.log(
      `${CYAN}  Database Host :${RESET} ${connectionInstance.connection.host}`
    );
    console.log(
      `${CYAN}  Database Name :${RESET} ${connectionInstance.connection.name}\n`
    );

    return connectionInstance;
  } catch (error) {
    console.error(`\n${RED}${BOLD}✖ MONGODB CONNECTION FAILED:${RESET} ${error.message}\n`);

    if (error.message.includes("ECONNREFUSED")) {
      console.error(`${YELLOW}${BOLD}[ActionGate Diagnostics] MongoDB Daemon is Offline on 127.0.0.1:27017${RESET}`);
      console.error(`${YELLOW}To resolve, start your local MongoDB instance using ONE of the following:${RESET}`);
      console.error(`  ${BOLD}Option 1 (Docker):${RESET}    docker run -d -p 27017:27017 --name actiongate-mongo mongo:latest`);
      console.error(`  ${BOLD}Option 2 (Homebrew):${RESET}  brew services start mongodb-community\n`);
    }

    process.exit(1);
  }
};

module.exports = connectDB;
