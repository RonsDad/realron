#!/usr/bin/env node

/**
 * Script to start the Docker container for Claude's computer use tool
 * This is designed to be run with concurrently alongside other services
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

// Load environment variables from .env file
const envPath = path.join(__dirname, '../../../../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const CONTAINER_NAME = 'claude-computer-use';
const COMPOSE_PATH = path.join(__dirname, 'docker-compose.yml');

// Check if ANTHROPIC_API_KEY is set
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY environment variable is not set');
  console.error('Please add ANTHROPIC_API_KEY to your .env file in the root directory');
  process.exit(1);
}

console.log('🤖 Starting Claude Computer Use Docker service...');

// Check if Docker is running
async function checkDocker() {
  try {
    await execAsync('docker ps');
    return true;
  } catch (error) {
    return false;
  }
}

// Check Docker first
checkDocker().then(async (dockerRunning) => {
  if (!dockerRunning) {
    console.error('❌ Docker is not running!');
    console.error('Please start Docker Desktop and try again.');
    console.error('On macOS: Open Docker Desktop from Applications');
    console.log('');
    console.log('ℹ️  Continuing without computer use tool...');
    // Exit gracefully so other services can continue
    process.exit(0);
  }
  
  // Continue with container startup
  startContainer();
}).catch(err => {
  console.error('Error checking Docker:', err);
  process.exit(0);
});

// Function to check if container is already running
function isContainerRunning() {
  return new Promise((resolve) => {
    const check = spawn('docker', ['ps', '-q', '-f', `name=${CONTAINER_NAME}`]);
    let output = '';
    
    check.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    check.on('close', () => {
      resolve(output.trim().length > 0);
    });
  });
}

// Function to stop existing container
function stopContainer() {
  return new Promise((resolve) => {
    console.log('🛑 Stopping existing container...');
    const stop = spawn('docker-compose', ['-f', COMPOSE_PATH, 'down'], {
      cwd: __dirname
    });
    
    stop.on('close', () => {
      resolve();
    });
  });
}


// Main container startup function
async function startContainer() {
  try {
    const running = await isContainerRunning();
    
    if (running) {
      await stopContainer();
    }
    
    // Create necessary directories
    const dirs = ['screenshots', 'shared'];
    dirs.forEach(dir => {
      const dirPath = path.join(__dirname, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
    
    console.log('🔨 Building Docker image...');
    
    // Build the image
    const build = spawn('docker-compose', ['-f', COMPOSE_PATH, 'build'], {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    build.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ Docker build failed');
        process.exit(1);
      }
      
      console.log('🚀 Starting container...');
      
      // Start the container
      const start = spawn('docker-compose', ['-f', COMPOSE_PATH, 'up'], {
        cwd: __dirname,
        stdio: 'inherit'
      });
      
      // Handle process termination
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down Claude Computer Use container...');
        await stopContainer();
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        await stopContainer();
        process.exit(0);
      });
      
      // Wait a bit then show access info
      setTimeout(() => {
        console.log('\n✅ Claude Computer Use container is running!');
        console.log('📺 Access the desktop:');
        console.log('   - VNC: vnc://localhost:5900');
        console.log('   - Web: http://localhost:6080/vnc.html');
        console.log('');
      }, 5000);
    });
  } catch (err) {
    console.error('Error starting container:', err);
    process.exit(1);
  }
}