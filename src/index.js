// dotenv MUST be configured before any other import reads process.env
require("dotenv").config({ path: "./.env" });

const connectDB = require("./db/index");
const app = require("./app");

/**
 * ActionGate Entry Point
 *
 * Bootstrap order:
 * 1. Configure environment variables.
 * 2. Establish MongoDB connection.
 * 3. Start the HTTP server only after a confirmed DB connection.
 *
 * This guarantees the API never accepts live traffic in an uninitialized state.
 */
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`\u26A1 ActionGate server is running on port: ${process.env.PORT || 5000}`);
    });
  })
  .catch((error) => {
    console.error("MONGODB connection FAILED:", error);
    process.exit(1);
  });
