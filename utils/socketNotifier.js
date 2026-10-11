/**
 * ActionGate - Real-Time Alert Dispatcher Utility
 * utils/socketNotifier.js
 * 
 * Principal Full-Stack Engineer Specification:
 * Decoupled event emission utility that safely pushes security events
 * to all connected SOC operator dashboards via Socket.IO.
 */

/**
 * Broadcasts a security event or telemetry update to all connected SOC clients.
 * 
 * Supported Event Types:
 * - 'ACTION_HELD': Pushes newly held actions to populate operator approval queue.
 * - 'ACTION_BLOCKED': Pushes critical block alerts with red flashing indicators.
 * - 'ACTION_ALLOWED': Streams allowed actions into the live telemetry feed.
 * - 'METRICS_UPDATED': Triggers client-side re-fetching or updating of dashboard counters.
 * 
 * @param {string} eventType - The socket event name
 * @param {Object} payload - Serialized telemetry, action object, or notification details
 */
function broadcastAlert(eventType, payload) {
  try {
    // Lazily resolve io from server.js to prevent circular dependency deadlocks
    const { io } = require('../server');

    if (!io) {
      console.warn('[ActionGate SocketNotifier] Warning: Socket.IO server instance not yet initialized.');
      return;
    }

    const enrichedPayload = {
      event: eventType,
      data: payload,
      emitted_at: new Date().toISOString()
    };

    // Broadcast event across all connected sockets
    io.emit(eventType, enrichedPayload);

    // Also emit a unified telemetry stream event for monolithic frontend listeners
    io.emit('TELEMETRY_STREAM', enrichedPayload);

  } catch (error) {
    // Non-blocking catch ensures WebSocket transport failures do not disrupt HTTP response cycle
    console.error(`[ActionGate SocketNotifier Error] Failed to broadcast event '${eventType}':`, error.message);
  }
}

module.exports = {
  broadcastAlert
};
