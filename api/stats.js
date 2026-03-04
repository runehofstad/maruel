const PLATFORMS = [
  { key: 'spotify',       label: 'Spotify' },
  { key: 'apple',         label: 'Apple Music' },
  { key: 'youtube-music', label: 'YouTube Music' },
  { key: 'youtube',       label: 'YouTube' },
  { key: 'tidal',         label: 'Tidal' },
  { key: 'amazon',        label: 'Amazon Music' },
  { key: 'soundcloud',    label: 'SoundCloud' },
  { key: 'songbox',       label: 'Songbox' },
  { key: 'tiktok',        label: 'TikTok' },
  { key: 'instagram',     label: 'Instagram' },
  { key: 'email',         label: 'E-post' }
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache');

  const secret = process.env.STATS_SECRET;
  if (secret && req.query.key !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: 'KV not configured' });
  }

  const commands = [
    ['GET', 'stats:pageviews'],
    ...PLATFORMS.map(p => ['GET', `stats:click:${p.key}`])
  ];

  const response = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  });

  const data = await response.json();

  const pageviews = parseInt(data[0]?.result || 0, 10);
  const clicks = {};
  PLATFORMS.forEach((platform, i) => {
    clicks[platform.key] = parseInt(data[i + 1]?.result || 0, 10);
  });

  const totalClicks = Object.values(clicks).reduce((a, b) => a + b, 0);

  return res.status(200).json({
    pageviews,
    totalClicks,
    clicks,
    platforms: PLATFORMS
  });
};
