'use strict';
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

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

// ── 4. Request Router ───────────────────────────────────────
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

  // Security: Prevent path traversal
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

server.listen(PORT, () => {
  const line = '═'.repeat(54);
  console.log('\n' + line);
  console.log('  🚀  Meteor Blaster  —  Node.js + Supabase Edition');
  console.log(line);
  console.log(`  Local Game:   http://localhost:${PORT}`);
  console.log(`  Supabase:     ${isSupabaseConfigured() ? '🟢 Connected (' + SUPABASE_URL + ')' : '🟡 Not configured in .env (using local fallback)'}`);
  console.log(line + '\n');
});
