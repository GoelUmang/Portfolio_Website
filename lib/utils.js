const ALLOWED_ORIGINS = [
  process.env.ORIGIN,                        // primary: https://goelumang.com
  'https://www.goelumang.com',               // www variant
].filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return false;              // block requests with no Origin header
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow any dynamic Vercel preview branch for this project
  if (origin.endsWith('.vercel.app') && origin.includes('umang-goel')) return true;
  return false;
}

function setCorsHeaders(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0'); // modern best practice: rely on CSP
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  isOriginAllowed,
  setCorsHeaders,
  setSecurityHeaders,
  escapeHtml
};
