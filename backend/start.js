const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const backendDir = __dirname;
const isWindows = process.platform === 'win32';
const isProduction = process.env.NODE_ENV === 'production';
const useGlobalPython = process.env.USE_GLOBAL_PYTHON === 'true';
const nodeAppEntry = process.env.NODE_APP_ENTRY || 'server.js';
const nodePort = parseInt(process.env.PORT || '5000', 10);
const gaitPort = parseInt(process.env.GAIT_ANALYSIS_PORT || '5001', 10);
const therapyPort = parseInt(process.env.THERAPY_PORT || process.env.EXERCISE_SERVICE_PORT || '5002', 10);

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', reason => {
  console.error('Unhandled Rejection:', reason);
});

function getLocalIP() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  return '127.0.0.1';
}

function getVenvExecutable(venvPath, executableName) {
  const folder = isWindows ? 'Scripts' : 'bin';
  const extension = isWindows && executableName === 'python' ? '.exe' : '';
  return path.join(venvPath, folder, executableName + extension);
}

function getPythonCommand(venvPath) {
  if (useGlobalPython) {
    return isWindows ? 'python' : 'python3';
  }

  return getVenvExecutable(venvPath, 'python');
}

function getPipCommand(venvPath) {
  if (useGlobalPython) {
    return isWindows ? 'pip' : 'pip3';
  }

  return getVenvExecutable(venvPath, 'pip');
}

function runCommand(command, args, cwd, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...extraEnv },
      shell: false,
      stdio: 'inherit'
    });

    child.on('close', code => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code}`));
    });

    child.on('error', reject);
  });
}

async function ensurePythonDependencies(service) {
  if (useGlobalPython) {
    console.log(`[SKIP] Using global Python environment for ${service.name}`);
    return;
  }

  const pythonPath = getVenvExecutable(service.venv, 'python');
  const pipPath = getVenvExecutable(service.venv, 'pip');

  if (!fs.existsSync(pythonPath)) {
    console.log(`[SETUP] Creating virtual environment for ${service.name}`);
    await runCommand(isWindows ? 'python' : 'python3', ['-m', 'venv', service.venv], backendDir);
  }

  console.log(`[SETUP] Installing Python dependencies for ${service.name}`);
  await runCommand(pipPath, ['install', '--upgrade', 'pip'], service.cwd);
  await runCommand(pipPath, ['install', '-r', service.requirements], service.cwd);
}

function startPythonService(service) {
  const pythonCommand = getPythonCommand(service.venv);
  const appPath = path.join(service.cwd, 'app.py');

  return spawn(pythonCommand, [appPath], {
    cwd: service.cwd,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1',
      FLASK_ENV: process.env.FLASK_ENV || (isProduction ? 'production' : 'development')
    },
    stdio: 'inherit'
  });
}

function startNodeService() {
  const resolvedEntry = getNodeEntryPath();

  return spawn('node', [resolvedEntry], {
    cwd: backendDir,
    env: process.env,
    stdio: 'inherit'
  });
}

function getNodeEntryPath() {
  const resolvedEntry = path.join(backendDir, nodeAppEntry);

  if (!fs.existsSync(resolvedEntry)) {
    throw new Error(`NODE_APP_ENTRY does not exist: ${resolvedEntry}`);
  }

  return resolvedEntry;
}

async function checkPorts() {
  const net = require('net');
  const ports = [nodePort, gaitPort, therapyPort];

  const checks = ports.map(port => new Promise(resolve => {
    const tester = net.createServer();

    tester.once('error', () => resolve({ port, available: false }));
    tester.once('listening', () => tester.close(() => resolve({ port, available: true })));
    tester.listen(port, '0.0.0.0');
  }));

  const results = await Promise.all(checks);
  const blocked = results.filter(result => !result.available);

  if (blocked.length > 0) {
    throw new Error(`Required ports are already in use: ${blocked.map(item => item.port).join(', ')}`);
  }
}

async function main() {
  console.log('\n========================================');
  console.log('  CVACare Backend Services');
  console.log('========================================\n');

  const services = [
    {
      name: 'Gait Analysis',
      cwd: path.join(backendDir, 'gait-analysis'),
      requirements: path.join(backendDir, 'gait-analysis', 'requirements.txt'),
      venv: path.join(backendDir, 'gait-analysis', 'venv'),
      port: gaitPort
    },
    {
      name: 'Therapy',
      cwd: path.join(backendDir, 'therapy-exercises'),
      requirements: path.join(backendDir, 'therapy-exercises', 'requirements.txt'),
      venv: path.join(backendDir, 'therapy-exercises', 'venv'),
      port: therapyPort
    }
  ];

  for (const service of services) {
    if (!fs.existsSync(service.cwd)) {
      throw new Error(`Missing service directory: ${service.cwd}`);
    }
    if (!fs.existsSync(service.requirements) && !useGlobalPython) {
      throw new Error(`Missing requirements file: ${service.requirements}`);
    }
  }

  getNodeEntryPath();

  await checkPorts();

  for (const service of services) {
    await ensurePythonDependencies(service);
  }

  const children = [];

  console.log('[START] Launching Python services...');
  for (const service of services) {
    console.log(`  -> ${service.name} on port ${service.port}`);
    children.push(startPythonService(service));
  }

  console.log(`  -> Node API on port ${nodePort}`);
  children.push(startNodeService());

  const localIP = getLocalIP();
  console.log('\n========================================');
  console.log('  All Services Running');
  console.log('========================================');
  console.log(`  Node entry:    ${nodeAppEntry}`);
  console.log(`  Node API:      http://127.0.0.1:${nodePort}`);
  console.log(`  Gait Service:  http://127.0.0.1:${gaitPort}`);
  console.log(`  Therapy API:   http://127.0.0.1:${therapyPort}`);
  console.log(`  Network API:   http://${localIP}:${nodePort}`);
  console.log('\nPress Ctrl+C to stop all services\n');

  const shutdown = signal => {
    console.log(`\n[STOP] Received ${signal}, shutting down services...`);
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
    }

    setTimeout(() => process.exit(0), 1000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  children.forEach(child => {
    child.on('exit', code => {
      if (code !== null && code !== 0) {
        console.error(`[ERROR] A service exited with code ${code}`);
        shutdown('SERVICE_EXIT');
      }
    });
  });
}

main().catch(error => {
  console.error('[FATAL]', error.message);
  process.exit(1);
});
