// dotenv MUST be configured before any other import reads process.env
require("dotenv").config({ path: "./.env" });

const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./db/index");
const app = require("./app");

/**
 * ActionGate Entry Point
 *
 * Strict Bootstrapping Protocol:
 * 1. Establish and verify MongoDB connection.
 * 2. Start HTTP listener ONLY AFTER DB promise resolves.
 * 3. Attach Socket.IO for real-time telemetry streaming to SOC frontend.
 * 4. Fail fast and exit if database connection fails.
 */
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
        credentials: true
      }
    });

    app.set("io", io);

    io.on("connection", (socket) => {
      console.log(`[ActionGate Socket] SOC Operator connected: ${socket.id}`);
      socket.on("disconnect", () => {
        console.log(`[ActionGate Socket] SOC Operator disconnected: ${socket.id}`);
      });
    });

    server.listen(PORT, () => {
      console.log(`⚡ ActionGate Gateway listening on: http://127.0.0.1:${PORT}`);
      console.log(`🔒 Health Check endpoint active at: http://127.0.0.1:${PORT}/health`);
      console.log(`📡 Real-time WebSocket streaming active on port: ${PORT}\n`);
    });

    // Handle process termination gracefully
    process.on("SIGINT", () => {
      console.log("\n[ActionGate] Shutting down server gracefully...");
      server.close(() => {
        console.log("[ActionGate] Server stopped.");
        process.exit(0);
      });
    });
  })
  .catch((error) => {
    console.error("FATAL: Server startup aborted due to database failure:", error.message);
    process.exit(1);
  });
