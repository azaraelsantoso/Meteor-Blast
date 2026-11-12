// Vercel Serverless Function: /api/leaderboard
const DEFAULT_SUPABASE_URL = 'https://famcdzykmsvallzogddb.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_6iTtEjm1Ne2_9ttkl1p--w_HDDj_I0c';

const SUPABASE_URL = (process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).trim().replace(/\/$/, '');
const SUPABASE_KEY = (process.env.SUPABASE_KEY || DEFAULT_SUPABASE_KEY).trim();

async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase Error (${response.status}): ${errorText}`);
  }
  return response.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, apikey, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const data = await supabaseFetch('leaderboard?select=id,player_name,score,level,created_at&order=score.desc&limit=10');
      return res.status(200).json({
        success: true,
        configured: true,
        source: 'supabase',
        scores: data
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const rawName = String(body.player_name || 'PILOT').trim();
      const playerName = rawName.slice(0, 16) || 'PILOT';
      const score = Math.max(0, parseInt(body.score || 0, 10));
      const level = Math.max(1, parseInt(body.level || 1, 10));

      const insertData = {
        player_name: playerName,
        score,
        level,
      };

      const result = await supabaseFetch('leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(insertData)
      });

      return res.status(201).json({
        success: true,
        source: 'supabase',
        entry: Array.isArray(result) ? result[0] : result
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
