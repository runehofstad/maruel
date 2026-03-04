const ALLOWED_EVENTS = ['pageview', 'click'];
const ALLOWED_LINKS = [
  'spotify', 'apple', 'youtube-music', 'youtube',
  'tidal', 'amazon', 'soundcloud', 'songbox',
  'tiktok', 'instagram', 'email'
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { event, link } = req.body || {};

  if (!event || !ALLOWED_EVENTS.includes(event)) {
    return res.status(400).json({ error: 'Invalid event' });
  }
  if (event === 'click' && (!link || !ALLOWED_LINKS.includes(link))) {
    return res.status(400).json({ error: 'Invalid link' });
  }

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: 'KV not configured' });
  }

  const key = event === 'pageview' ? 'stats:pageviews' : `stats:click:${link}`;

  await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.status(200).json({ ok: true });
};
