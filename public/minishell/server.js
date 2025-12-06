const http = require('http');
const path = require('path');

const express = require('express');
const WebSocket = require('ws');
const Docker = require('dockerode');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const docker = new Docker();
const PORT = process.env.PORT || 3000;

// Track active sessions
const activeSessions = new Map();
const MAX_SESSIONS_PER_IP = 3;
const SESSION_TIMEOUT = 300000; // 5 minutes

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        connectSrc: ["'self'", 'ws://localhost:3000', 'wss://localhost:3000'],
      },
    },
  })
);

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting for WebSocket connections
const wsLimiter = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const userLimit = wsLimiter.get(ip) || { count: 0, resetTime: now + 60000 };

  if (now > userLimit.resetTime) {
    userLimit.count = 0;
    userLimit.resetTime = now + 60000;
  }

  if (userLimit.count >= 10) {
    return false;
  }

  userLimit.count++;
  wsLimiter.set(ip, userLimit);
  return true;
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
}

// WebSocket connection handler
wss.on('connection', async (ws, req) => {
  const clientIp = getClientIp(req);

  // Rate limiting
  if (!checkRateLimit(clientIp)) {
    ws.send(JSON.stringify({ type: 'error', data: 'Rate limit exceeded. Please wait.' }));
    ws.close();
    return;
  }

  // Check concurrent sessions
  const userSessions = Array.from(activeSessions.values()).filter((s) => s.ip === clientIp);
  if (userSessions.length >= MAX_SESSIONS_PER_IP) {
    ws.send(JSON.stringify({ type: 'error', data: 'Maximum concurrent sessions reached.' }));
    ws.close();
    return;
  }

  const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  let container = null;
  let stream = null;

  console.log(`[${sessionId}] New connection from ${clientIp}`);

  try {
    // Create container
    container = await docker.createContainer({
      Image: 'minishell-runner:latest',
      Cmd: ['/usr/local/bin/minishell'],
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      OpenStdin: true,
      StdinOnce: false,
      HostConfig: {
        Memory: 50 * 1024 * 1024,
        MemorySwap: 50 * 1024 * 1024,
        NanoCpus: 500000000,
        PidsLimit: 50,
        NetworkMode: 'none',
        ReadonlyRootfs: true,
        SecurityOpt: ['no-new-privileges'],
        CapDrop: ['ALL'],
        Tmpfs: {
          '/tmp': 'rw,noexec,nosuid,size=10m',
          '/home/shelluser/workspace': 'rw,noexec,nosuid,size=5m',
        },
      },
      Labels: {
        'minishell-session': sessionId,
        'created-at': new Date().toISOString(),
      },
    });

    await container.start();

    // Attach to container
    stream = await container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true,
    });

    // Store session info
    activeSessions.set(sessionId, {
      container,
      stream,
      ws,
      ip: clientIp,
      startTime: Date.now(),
    });

    // Send initial connection success
    ws.send(JSON.stringify({ type: 'connected', sessionId }));

    // Forward container output to WebSocket
    stream.on('data', (chunk) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: chunk.toString('utf8') }));
      }
    });

    // Handle WebSocket messages (user input)
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'input' && stream && stream.writable) {
          stream.write(data.data);
        } else if (data.type === 'resize' && data.cols && data.rows) {
          container
            .resize({
              h: data.rows,
              w: data.cols,
            })
            .catch((err) => console.error('Resize error:', err.message));
        }
      } catch (err) {
        console.error('Message handling error:', err.message);
      }
    });

    // Session timeout
    const timeout = setTimeout(async () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'error',
            data: '\r\n\x1b[1;33mSession timeout (5 minutes). Disconnecting...\x1b[0m\r\n',
          })
        );
        ws.close();
      }
    }, SESSION_TIMEOUT);

    // Cleanup on disconnect
    ws.on('close', async () => {
      clearTimeout(timeout);
      console.log(`[${sessionId}] Connection closed`);

      if (stream) {
        try {
          stream.end();
        } catch (err) {}
      }

      if (container) {
        try {
          await container.kill();
          await container.remove();
        } catch (err) {
          console.error('Cleanup error:', err.message);
        }
      }

      activeSessions.delete(sessionId);
    });

    stream.on('error', (err) => {
      console.error(`[${sessionId}] Stream error:`, err.message);
    });
  } catch (error) {
    console.error(`[${sessionId}] Setup error:`, error.message);

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'error',
          data: 'Failed to start shell session. Please try again.',
        })
      );
      ws.close();
    }

    if (container) {
      try {
        await container.remove({ force: true });
      } catch (err) {}
    }
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await docker.ping();
    res.json({
      status: 'healthy',
      activeSessions: activeSessions.size,
      docker: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// Cleanup old containers
const cleanupOldContainers = async () => {
  try {
    const containers = await docker.listContainers({
      all: true,
      filters: { label: ['minishell-session'] },
    });

    for (const containerInfo of containers) {
      const createdAt = containerInfo.Labels['created-at'];
      if (createdAt) {
        const age = Date.now() - new Date(createdAt).getTime();
        if (age > 3600000) {
          const container = docker.getContainer(containerInfo.Id);
          await container.remove({ force: true });
          console.log(`Cleaned up old container: ${containerInfo.Id.substring(0, 12)}`);
        }
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
};

setInterval(cleanupOldContainers, 10 * 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, cleaning up...');

  // Close all active sessions
  for (const [sessionId, session] of activeSessions.entries()) {
    try {
      session.ws.close();
      await session.container.kill();
      await session.container.remove();
    } catch (err) {}
  }

  await cleanupOldContainers();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`🐚 Minishell PTY server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
});
