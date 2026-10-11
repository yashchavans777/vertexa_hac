require('dotenv').config({ path: './.env' });
const connectDB = require('./src/db/index');
const app = require('./src/app');

// Dynamic port configuration: env-overridable, with automatic fallback
// to the next port if the preferred one is already in use (EADDRINUSE).
const BASE_PORT = Number.parseInt(process.env.PORT, 10) || 5002;
const MAX_PORT_ATTEMPTS = 5;

function listenOn(port, attemptsLeft) {
  const server = app.listen(port, () => {
    console.log(`[ActionGate Server] Security gateway listening on port ${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.warn(`[ActionGate Server] Port ${port} in use (EADDRINUSE) — falling back to port ${port + 1}...`);
      listenOn(port + 1, attemptsLeft - 1);
      return;
    }
    console.error(`[Fatal] HTTP server could not bind: ${error.message}`);
    process.exit(1);
  });
}

connectDB()
  .then(() => {
    listenOn(BASE_PORT, MAX_PORT_ATTEMPTS);
  })
  .catch((err) => {
    console.error(`[Fatal] Database connection error: ${err.message}`);
    process.exit(1);
  });

