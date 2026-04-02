#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = (color, platform, message) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] [${platform}]${colors.reset} ${message}`);
};

// Start Events platform (port 3000)
const eventsProcess = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  env: { ...process.env, PORT: '3000', VITE_PLATFORM: 'events' },
  stdio: 'pipe'
});

// Start Booking platform (port 3001)
const bookingProcess = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  env: { ...process.env, PORT: '3001', VITE_PLATFORM: 'booking' },
  stdio: 'pipe'
});

// Handle Events platform output
eventsProcess.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Local:') || output.includes('Network:')) {
    log('green', 'EVENTS', output.trim());
  } else if (output.includes('error') || output.includes('Error')) {
    log('red', 'EVENTS', output.trim());
  } else {
    log('blue', 'EVENTS', output.trim());
  }
});

eventsProcess.stderr.on('data', (data) => {
  log('red', 'EVENTS', data.toString().trim());
});

// Handle Booking platform output
bookingProcess.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Local:') || output.includes('Network:')) {
    log('green', 'BOOKING', output.trim());
  } else if (output.includes('error') || output.includes('Error')) {
    log('red', 'BOOKING', output.trim());
  } else {
    log('cyan', 'BOOKING', output.trim());
  }
});

bookingProcess.stderr.on('data', (data) => {
  log('red', 'BOOKING', data.toString().trim());
});

// Handle process exits
eventsProcess.on('close', (code) => {
  log('yellow', 'EVENTS', `Process exited with code ${code}`);
});

bookingProcess.on('close', (code) => {
  log('yellow', 'BOOKING', `Process exited with code ${code}`);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  log('yellow', 'SYSTEM', 'Shutting down both platforms...');
  eventsProcess.kill('SIGINT');
  bookingProcess.kill('SIGINT');
  process.exit(0);
});

log('magenta', 'SYSTEM', 'Starting L8 Events & Booking platforms...');
log('blue', 'EVENTS', 'Starting on http://localhost:3000');
log('cyan', 'BOOKING', 'Starting on http://localhost:3001');
log('yellow', 'SYSTEM', 'Press Ctrl+C to stop both platforms');
