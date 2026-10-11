import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || (window.location.port === '5001' ? 'http://127.0.0.1:5001' : 'http://127.0.0.1:5000');

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log(`%c[ActionGate Socket] Connected: ${this.socket.id}`, 'color: #00F5FF; font-weight: bold;');
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[ActionGate Socket] Connection error:', err.message);
      });

      this.socket.on('disconnect', (reason) => {
        console.log(`%c[ActionGate Socket] Disconnected: ${reason}`, 'color: #FFB800; font-weight: bold;');
      });
    }
    return this.socket;
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  onActionHeld(callback) {
    const s = this.getSocket();
    s.on('ACTION_HELD', callback);
    return () => s.off('ACTION_HELD', callback);
  }

  onActionBlocked(callback) {
    const s = this.getSocket();
    s.on('ACTION_BLOCKED', callback);
    return () => s.off('ACTION_BLOCKED', callback);
  }

  onActionAllowed(callback) {
    const s = this.getSocket();
    s.on('ACTION_ALLOWED', callback);
    return () => s.off('ACTION_ALLOWED', callback);
  }

  onLedgerBlockAdded(callback) {
    const s = this.getSocket();
    s.on('LEDGER_BLOCK_ADDED', callback);
    return () => s.off('LEDGER_BLOCK_ADDED', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
