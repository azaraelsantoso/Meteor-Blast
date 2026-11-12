'use strict';
const http   = require('http');
const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

// ── 1. Load .env file ───────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
      console.log('✓ Loaded .env file');
    } catch (err) {
      console.warn('! Failed reading .env file:', err.message);
    }
  }
}
loadEnv();

const PORT       = parseInt(process.env.PORT || '3000', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');

// Supabase configuration
const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const SUPABASE_KEY = (process.env.SUPABASE_KEY || '').trim();

function isSupabaseConfigured() {
  return (
    SUPABASE_URL.length > 0 &&
    !SUPABASE_URL.includes('your-project-id') &&
    SUPABASE_KEY.length > 0 &&
    !SUPABASE_KEY.includes('your-supabase-anon-key')
  );
}

// In-memory fallback scores if Supabase is not yet configured
let fallbackScores = [
  { id: 1, player_name: 'ACE-PILOT',  score: 12500, level: 8, created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 2, player_name: 'STAR-FOX',   score: 8400,  level: 6, created_at: new Date(Date.now() - 3600000 * 8).toISOString() },
  { id: 3, player_name: 'COSMO-X',    score: 5200,  level: 4, created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
};

// ── 2. Helper to fetch from Supabase REST API ────────────────
async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey':        SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Accept':        'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// ── 3. Parse JSON Body ──────────────────────────────────────
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// ── 4. RFC 6455 Zero-Dependency WebSocket Implementation ────
function sendWs(socket, data) {
  if (!socket || socket.destroyed || !socket.writable) return;
  const payload = Buffer.from(typeof data === 'string' ? data : JSON.stringify(data), 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  socket.write(Buffer.concat([header, payload]));
}

// Multiplayer Rooms Map: code -> { code, host: socket, guest: socket, state }
const mpRooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return mpRooms.has(code) ? generateRoomCode() : code;
}

function handleWsFrame(socket, message) {
  try {
    const msg = JSON.parse(message);
    const { type, code, payload } = msg;

    if (type === 'CREATE_ROOM') {
      const roomCode = generateRoomCode();
      socket.roomCode = roomCode;
      socket.role = 'host';
      mpRooms.set(roomCode, {
        code: roomCode,
        host: socket,
        guest: null,
        createdAt: Date.now()
      });
      sendWs(socket, { type: 'ROOM_CREATED', code: roomCode });
      console.log(`[Multiplayer] Room created: ${roomCode}`);
      return;
    }

    if (type === 'JOIN_ROOM') {
      const cleanCode = String(code || '').trim().toUpperCase();
      const room = mpRooms.get(cleanCode);
      if (!room) {
        sendWs(socket, { type: 'JOIN_ERROR', message: `Room [${cleanCode}] tidak ditemukan!` });
        return;
      }
      if (room.guest && !room.guest.destroyed) {
        sendWs(socket, { type: 'JOIN_ERROR', message: `Room [${cleanCode}] sudah penuh (maksimal 2 pemain)!` });
        return;
      }

      room.guest = socket;
      socket.roomCode = cleanCode;
      socket.role = 'guest';

      // Notify both players that room is ready to start
      sendWs(room.host, { type: 'ROOM_READY', role: 'host', code: cleanCode });
      sendWs(room.guest, { type: 'ROOM_READY', role: 'guest', code: cleanCode });
      console.log(`[Multiplayer] Guest joined room: ${cleanCode}`);
      return;
    }

    // Forward game sync & actions between host and guest
    if (socket.roomCode) {
      const room = mpRooms.get(socket.roomCode);
      if (room) {
        const peer = socket.role === 'host' ? room.guest : room.host;
        if (peer && !peer.destroyed) {
          sendWs(peer, msg);
        }
      }
    }
  } catch (err) {
    console.warn('[WS Parse Error]:', err.message);
  }
}

function handleWsClose(socket) {
  if (socket.roomCode) {
    const room = mpRooms.get(socket.roomCode);
    if (room) {
      const peer = socket.role === 'host' ? room.guest : room.host;
      if (peer && !peer.destroyed) {
        sendWs(peer, { type: 'PEER_DISCONNECTED', message: 'Partner terputus dari ruangan.' });
      }
      mpRooms.delete(socket.roomCode);
      console.log(`[Multiplayer] Room closed: ${socket.roomCode}`);
    }
  }
}

// ── 5. Request Router ───────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname  = parsedUrl.pathname;

  // ── API: Get Config / Status ──────────────────────────────
  if (pathname === '/api/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      configured: isSupabaseConfigured(),
      supabaseUrl: isSupabaseConfigured() ? SUPABASE_URL : null,
      message: isSupabaseConfigured()
        ? 'Connected to Supabase'
        : 'Supabase belum dikonfigurasi di .env (menggunakan local fallback)'
    }));
  }

  // ── API: Get Leaderboard ──────────────────────────────────
  if (pathname === '/api/leaderboard' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');

    if (!isSupabaseConfigured()) {
      return res.end(JSON.stringify({
        success: true,
        configured: false,
        source: 'local_fallback',
        scores: fallbackScores.slice(0, 10).sort((a, b) => b.score - a.score),
        message: 'Supabase belum diisi di .env. Menggunakan data lokal.'
      }));
    }

    try {
      const data = await supabaseFetch('leaderboard?select=id,player_name,score,level,created_at&order=score.desc&limit=10');
      return res.end(JSON.stringify({
        success: true,
        configured: true,
        source: 'supabase',
        scores: data
      }));
    } catch (err) {
      console.error('Leaderboard Fetch Error:', err.message);
      return res.writeHead(500).end(JSON.stringify({
        success: false,
        error: err.message,
        fallbackScores: fallbackScores.slice(0, 10)
      }));
    }
  }

  // ── API: Submit Score ─────────────────────────────────────
  if (pathname === '/api/leaderboard' && req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');

    try {
      const payload = await parseJsonBody(req);
      const rawName = String(payload.player_name || 'PILOT').trim();
      const playerName = rawName.slice(0, 16) || 'PILOT';
      const score = Math.max(0, parseInt(payload.score || 0, 10));
      const level = Math.max(1, parseInt(payload.level || 1, 10));

      if (!isSupabaseConfigured()) {
        const newEntry = {
          id: Date.now(),
          player_name: playerName,
          score,
          level,
          created_at: new Date().toISOString()
        };
        fallbackScores.push(newEntry);
        fallbackScores.sort((a, b) => b.score - a.score);

        return res.end(JSON.stringify({
          success: true,
          configured: false,
          source: 'local_fallback',
          entry: newEntry,
          message: 'Skor disimpan secara lokal karena Supabase belum dikonfigurasi di .env'
        }));
      }

      // Kirim ke Supabase
      const insertResult = await supabaseFetch('leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer':       'return=representation'
        },
        body: JSON.stringify({
          player_name: playerName,
          score: score,
          level: level
        })
      });

      return res.end(JSON.stringify({
        success: true,
        configured: true,
        source: 'supabase',
        entry: Array.isArray(insertResult) ? insertResult[0] : insertResult
      }));

    } catch (err) {
      console.error('Score Submit Error:', err.message);
      res.writeHead(500);
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // ── Static Files Serving ──────────────────────────────────
  const urlPath  = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(PUBLIC_DIR, path.normalize(urlPath));

  if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== PUBLIC_DIR) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

// ── 6. Handle WebSocket Upgrade (RFC 6455) ───────────────────
server.on('upgrade', (req, socket, head) => {
  if (req.headers['upgrade']?.toLowerCase() !== 'websocket') {
    socket.destroy();
    return;
  }

  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const hash = crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${hash}\r\n\r\n`
  );

  let buffer = Buffer.alloc(0);

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= 2) {
      const firstByte = buffer[0];
      const secondByte = buffer[1];
      const isMasked = (secondByte & 0x80) !== 0;
      let payloadLen = secondByte & 0x7f;
      let offset = 2;

      if (payloadLen === 126) {
        if (buffer.length < offset + 2) break;
        payloadLen = buffer.readUInt16BE(offset);
        offset += 2;
      } else if (payloadLen === 127) {
        if (buffer.length < offset + 8) break;
        payloadLen = Number(buffer.readBigUInt64BE(offset));
        offset += 8;
      }

      let maskKey = null;
      if (isMasked) {
        if (buffer.length < offset + 4) break;
        maskKey = buffer.slice(offset, offset + 4);
        offset += 4;
      }

      if (buffer.length < offset + payloadLen) break;

      const rawPayload = buffer.slice(offset, offset + payloadLen);
      buffer = buffer.slice(offset + payloadLen);

      // Opcode 8 = connection close
      const opcode = firstByte & 0x0f;
      if (opcode === 0x08) {
        socket.destroy();
        handleWsClose(socket);
        break;
      }

      // Unmask payload if masked
      if (isMasked && maskKey) {
        for (let i = 0; i < rawPayload.length; i++) {
          rawPayload[i] ^= maskKey[i % 4];
        }
      }

      // Handle text payload (opcode 1)
      if (opcode === 0x01) {
        const text = rawPayload.toString('utf8');
        handleWsFrame(socket, text);
      }
    }
  });

  socket.on('close', () => handleWsClose(socket));
  socket.on('error', (err) => {
    console.warn('[WS Socket Error]:', err.message);
    handleWsClose(socket);
  });
});

server.listen(PORT, () => {
  const line = '═'.repeat(54);
  console.log('\n' + line);
  console.log('  🚀  Meteor Blaster  —  Multiplayer & Base Defense Edition');
  console.log(line);
  console.log(`  Local Game:   http://localhost:${PORT}`);
  console.log(`  Multiplayer:  WebSocket Co-op Room System Enabled`);
  console.log(`  Supabase:     ${isSupabaseConfigured() ? '🟢 Connected (' + SUPABASE_URL + ')' : '🟡 Not configured in .env (using local fallback)'}`);
  console.log(line + '\n');
});
