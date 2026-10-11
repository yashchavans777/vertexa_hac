// Starts Vite as a fully detached, windowless background process.
// The launcher exits immediately; Vite keeps running with no console,
// which makes it immune to console Ctrl+C / window-close events.
// (ESM syntax — client/package.json has "type": "module")
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const LOG = 'C:\\Users\\durgu\\AppData\\Local\\Temp\\actiongate-client-bg.log';
const viteBin = path.join(here, 'node_modules', 'vite', 'bin', 'vite.js');

if (!fs.existsSync(viteBin)) {
  console.error('vite.js not found at: ' + viteBin);
  process.exit(1);
}

const out = fs.openSync(LOG, 'a');
fs.writeSync(out, '\n=== vite background start ' + new Date().toISOString() + ' ===\n');

const child = spawn(process.execPath, [viteBin, '--port', '5173', '--strictPort'], {
  cwd: here,
  detached: true,
  windowsHide: true,
  stdio: ['ignore', out, out],
});

child.unref();
console.log('Vite started in background (PID ' + child.pid + '), log: ' + LOG);
