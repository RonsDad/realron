#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Ports used by the ron-ai application
const PORTS = [3000, 8001, 8765, 8000, 5900, 6080]; // Frontend (Next.js), Backend (Python API on 8001), Alternative Backend (8765), Legacy Backend (8000), VNC, NoVNC

async function killPort(port) {
  try {
    console.log(`🔍 Checking port ${port}...`);
    
    if (process.platform === 'win32') {
      // Windows command
      try {
        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
        if (stdout.trim()) {
          await execAsync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /f /pid %a`);
          console.log(`✅ Killed process(es) on port ${port}`);
        } else {
          console.log(`✅ Port ${port} is free`);
        }
      } catch (error) {
        console.log(`✅ Port ${port} is free`);
      }
    } else {
      // Unix/Linux/macOS command
      try {
        const { stdout } = await execAsync(`lsof -ti:${port}`);
        if (stdout.trim()) {
          const pids = stdout.trim().split('\n');
          console.log(`⚠️  Found ${pids.length} process(es) on port ${port}`);
          
          for (const pid of pids) {
            try {
              await execAsync(`kill -9 ${pid}`);
              console.log(`✅ Killed process ${pid} on port ${port}`);
            } catch (error) {
              console.log(`⚠️  Process ${pid} may have already been killed`);
            }
          }
        } else {
          console.log(`✅ Port ${port} is free`);
        }
      } catch (error) {
        if (error.code === 1) {
          console.log(`✅ Port ${port} is free`);
        } else {
          console.log(`❌ Error checking port ${port}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.log(`❌ Error with port ${port}:`, error.message);
  }
}

async function cleanupDocker() {
  console.log('🐳 Checking for existing Claude Computer Use container...');
  try {
    // Check if container exists
    const { stdout } = await execAsync('docker ps -aq -f name=claude-computer-use');
    if (stdout.trim()) {
      console.log('⚠️  Found existing container, stopping it...');
      await execAsync('docker stop claude-computer-use');
      await execAsync('docker rm claude-computer-use');
      console.log('✅ Cleaned up existing Docker container');
    } else {
      console.log('✅ No existing container found');
    }
  } catch (error) {
    // Docker might not be running or installed
    console.log('ℹ️  Docker cleanup skipped (Docker may not be running)');
  }
}

async function killAllPorts() {
  console.log('🧹 Cleaning up ports and Docker before starting ron-ai services...\n');
  
  // Clean up Docker first
  await cleanupDocker();
  
  // Then clean up ports
  for (const port of PORTS) {
    await killPort(port);
  }
  
  console.log('\n🎉 All ports and containers cleaned up! Ready to start ron-ai services.\n');
}

// Run if called directly
if (require.main === module) {
  killAllPorts().catch(console.error);
}

module.exports = { killAllPorts, killPort };