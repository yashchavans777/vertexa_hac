// dotenv MUST be configured before any other import reads process.env
require("dotenv").config({ path: "./.env" });

const net = require("net");
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
 * 5. Bind dynamically: probe ports with Node's `net` module starting at
 *    the preferred port (PORT in .env, fallback 5002) and bind to the
 *    first genuinely free one. A reactive EADDRINUSE handler remains as
 *    a safety net for the rare race between probe and bind.
 */

// Preferred port — fully configurable via environment variables.
const BASE_PORT = Number.parseInt(process.env.PORT, 10) || 5002;
const MAX_PORT_ATTEMPTS = 5; // probes PORT, PORT+1, ... (e.g. 5002 → 5006)

let activeServer = null;
let activePort = null;

/**
 * Probes a TCP port with Node's `net` module to determine whether it can
 * actually be bound right now. The probe binds exactly the same way the
 * real server will (all interfaces), then releases the port immediately.
 *
 * @param {number} port
 * @returns {Promise<boolean>} true when the port is free
 */
function isPortFree(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();

    probe.once("error", () => resolve(false)); // EADDRINUSE / EACCES / etc. => unusable
    probe.once("listening", () => {
      // Release the probe immediately so the real server can claim the port.
      probe.close(() => resolve(true));
    });

    probe.listen(port);
  });
}

/**
 * Walks up from `startPort` and resolves the first genuinely free port,
 * or null when every candidate in the range is taken.
 *
 * @param {number} startPort
 * @param {number} maxAttempts
 * @returns {Promise<number|null>}
 */
async function findAvailablePort(startPort, maxAttempts) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const port = startPort + attempt;
    const free = await isPortFree(port);

    if (free) {
      if (attempt > 0) {
        console.warn(
          `⚠️  [ActionGate] Port ${startPort} was busy — selected next available port ${port}.`
        );
      }
      return port;
    }

    console.warn(`⚠️  [ActionGate] Port ${port} is already in use — probing next port...`);
  }

  return null;
}

/**
 * Boots the HTTP + Socket.IO stack on a port that has already been
 * verified free. The /health route and WebSocket traffic are served by
 * this very same server instance, so everything shares the active port.
 *
 * @param {number} port verified-available port to bind
 */
function startServer(port) {
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
  app.set("port", port);

  io.on("connection", (socket) => {
    console.log(`[ActionGate Socket] SOC Operator connected: ${socket.id}`);
    socket.on("disconnect", () => {
      console.log(`[ActionGate Socket] SOC Operator disconnected: ${socket.id}`);
    });
  });

  server.listen(port, () => {
    activeServer = server;
    activePort = port;

    console.log(`\n✅ [ActionGate] Active port selected: ${port}`);
    console.log(`⚡ ActionGate Gateway listening on: http://127.0.0.1:${port}`);
    console.log(`🔒 Health Check bound to the same active port: http://127.0.0.1:${port}/health`);
    console.log(`📡 Real-time WebSocket (Socket.IO) bound to the same active port: ws://127.0.0.1:${port}\n`);
  });

  // Safety net: if another process claims the port in the tiny window
  // between the net-probe and this bind, re-probe instead of crashing.
  server.on("error", async (error) => {
    if (error.code === "EADDRINUSE") {
      console.warn(`⚠️  [ActionGate] Lost the race for port ${port} (EADDRINUSE) — re-probing...`);
      const nextPort = await findAvailablePort(port + 1, MAX_PORT_ATTEMPTS);

      if (nextPort) {
        startServer(nextPort);
        return;
      }

      console.error(
        `FATAL: No available port found from ${port + 1} onward. Free a port or set a different PORT in .env.`
      );
      process.exit(1);
    }

    console.error("FATAL: HTTP server could not bind:", error.message);
    process.exit(1);
  });
}

connectDB()
  .then(async () => {
    console.log(
      `🔌 [ActionGate] Probing for an available port starting at ${BASE_PORT} (up to ${MAX_PORT_ATTEMPTS} candidates)...`
    );
    const port = await findAvailablePort(BASE_PORT, MAX_PORT_ATTEMPTS);

    if (!port) {
      console.error(
        `FATAL: All candidate ports ${BASE_PORT}-${BASE_PORT + MAX_PORT_ATTEMPTS - 1} are in use. ` +
          `Free one of them or set a different PORT value in .env.`
      );
      process.exit(1);
    }

    startServer(port);

    // Handle process termination gracefully
    process.on("SIGINT", () => {
      console.log(`\n[ActionGate] Shutting down server (port ${activePort ?? "unknown"}) gracefully...`);
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
