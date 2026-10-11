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
 * 5. Bind dynamically: preferred port comes from the environment
 *    (PORT in .env, fallback 5001). If the port is busy (EADDRINUSE)
 *    the server automatically retries on the next port instead of crashing.
 */

// Preferred port — fully configurable via environment variables.
const BASE_PORT = Number.parseInt(process.env.PORT, 10) || 5001;
const MAX_PORT_ATTEMPTS = 5; // tries PORT, PORT+1, PORT+2, ... (e.g. 5001 → 5002 → ...)

let activeServer = null;

function listenOn(port, attemptsLeft) {
  // Socket.IO requires the raw HTTP server instance it attaches to.
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

  server.listen(port, () => {
    activeServer = server;
    console.log(`⚡ ActionGate Gateway listening on: http://127.0.0.1:${port}`);
    console.log(`🔒 Health Check endpoint active at: http://127.0.0.1:${port}/health`);
    console.log(`📡 Real-time WebSocket streaming active on port: ${port}\n`);
  });

  // Resilient port binding: never crash on EADDRINUSE — walk up the port range.
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
      const nextPort = port + 1;
      console.warn(
        `⚠️  [ActionGate] Port ${port} is already in use (EADDRINUSE) — falling back to port ${nextPort}...`
      );
      listenOn(nextPort, attemptsLeft - 1);
      return;
    }

    console.error("FATAL: HTTP server could not bind:", error.message);
    process.exit(1);
  });
}

connectDB()
  .then(() => {
    console.log(`🔌 [ActionGate] Binding API server (preferred port: ${BASE_PORT})...`);
    listenOn(BASE_PORT, MAX_PORT_ATTEMPTS);

    // Handle process termination gracefully
    process.on("SIGINT", () => {
      console.log("\n[ActionGate] Shutting down server gracefully...");
      if (activeServer) {
        activeServer.close(() => {
          console.log("[ActionGate] Server stopped.");
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  })
  .catch((error) => {
    console.error("FATAL: Server startup aborted due to database failure:", error.message);
    process.exit(1);
  });

