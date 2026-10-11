require('dotenv').config({ path: './.env' });
const net = require('net');
const connectDB = require('./src/db/index');
const app = require('./src/app');

// Dynamic port configuration: probe ports with Node's `net` module and
// bind to the first genuinely free one (preferred: PORT in .env, fallback 5002).
const BASE_PORT = Number.parseInt(process.env.PORT, 10) || 5002;
const MAX_PORT_ATTEMPTS = 5;

function isPortFree(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => probe.close(() => resolve(true)));
    probe.listen(port);
  });
}

async function findAvailablePort(startPort, maxAttempts) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const port = startPort + attempt;
    if (await isPortFree(port)) {
      if (attempt > 0) {
        console.warn(`[ActionGate Server] Port ${startPort} was busy — selected next available port ${port}.`);
      }
      return port;
    }
    console.warn(`[ActionGate Server] Port ${port} is already in use — probing next port...`);
  }
  return null;
}

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`[ActionGate Server] Security gateway listening on port ${port} (health check: /health on the same port)`);
  });

  // Safety net for the race between the net-probe and the actual bind.
  server.on('error', async (error) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`[ActionGate Server] Lost the race for port ${port} (EADDRINUSE) — re-probing...`);
      const nextPort = await findAvailablePort(port + 1, MAX_PORT_ATTEMPTS);
      if (nextPort) {
        startServer(nextPort);
        return;
      }
      console.error(`[Fatal] No available port found from ${port + 1} onward.`);
      process.exit(1);
    }
    console.error(`[Fatal] HTTP server could not bind: ${error.message}`);
    process.exit(1);
  });
}

connectDB()
  .then(async () => {
    const port = await findAvailablePort(BASE_PORT, MAX_PORT_ATTEMPTS);
    if (!port) {
      console.error(`[Fatal] All candidate ports ${BASE_PORT}-${BASE_PORT + MAX_PORT_ATTEMPTS - 1} are in use. Free one or change PORT in .env.`);
      process.exit(1);
    }
    startServer(port);
  })
  .catch((err) => {
    console.error(`[Fatal] Database connection error: ${err.message}`);
    process.exit(1);
  });


