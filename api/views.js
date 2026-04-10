const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { isOriginAllowed, setCorsHeaders, setSecurityHeaders } = require('../lib/utils');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

module.exports = async (req, res) => {
  setSecurityHeaders(res);
  const origin = req.headers.origin;

  if (req.method === 'OPTIONS') {
    if (isOriginAllowed(origin)) {
      setCorsHeaders(res, origin);
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (origin && isOriginAllowed(origin)) {
    setCorsHeaders(res, origin);
  } else if (origin) {
    return res.status(403).json({ error: 'Forbidden: origin not allowed' });
  }

  if (!supabase) {
    return res.json({ totalViews: 0, uniqueVisitors: 0 });
  }

  try {
    const rawIp = req.headers['x-vercel-forwarded-for'] || req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const salt = process.env.IP_HASH_SALT || 'default-salt';
    const ipHash = crypto.createHash('sha256').update(salt + rawIp).digest('hex');
    const today = new Date().toISOString().split('T')[0];

    await supabase.from('site_views').upsert(
      { ip_hash: ipHash, visited_date: today },
      { onConflict: 'ip_hash, visited_date', ignoreDuplicates: true }
    );

    const { data, error } = await supabase.rpc('get_view_metrics');
    if (error) throw error;
    
    const stats = data && data.length > 0 ? data[0] : { total_views: 0, unique_visitors: 0 };
    res.json({ totalViews: parseInt(stats.total_views, 10), uniqueVisitors: parseInt(stats.unique_visitors, 10) });
  } catch (err) {
    console.error('Views error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve views' });
  }
};
