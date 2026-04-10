const transporter = require('../lib/mailer');
const { isOriginAllowed, setCorsHeaders, setSecurityHeaders, escapeHtml } = require('../lib/utils');

// ── In-memory rate limiter ───────────────────────────────────────────────────
// NOTE: This resets on cold starts. For a portfolio contact form this provides
// reasonable protection against sustained abuse within a warm instance.
// For stronger guarantees, upgrade to Upstash Redis + @upstash/ratelimit.
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX       = 5;               // max submissions per window per IP
const ipHits = new Map();

function pruneExpired() {
  const now = Date.now();
  for (const [ip, record] of ipHits) {
    if (now > record.windowStart + RATE_LIMIT_WINDOW_MS) {
      ipHits.delete(ip);
    }
  }
}

/**
 * Returns true if the request should be blocked.
 */
function isRateLimited(ip) {
  pruneExpired();
  const now = Date.now();
  const record = ipHits.get(ip);

  if (!record || now > record.windowStart + RATE_LIMIT_WINDOW_MS) {
    ipHits.set(ip, { windowStart: now, count: 1 });
    return false;
  }

  record.count += 1;
  if (record.count > RATE_LIMIT_MAX) {
    return true;
  }
  return false;
}

// ── CORS ─────────────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  // Security headers on every response
  setSecurityHeaders(res);

  // ── CORS preflight ──────────────────────────────────────────────────────
  const origin = req.headers.origin;

  if (req.method === 'OPTIONS') {
    if (isOriginAllowed(origin)) {
      setCorsHeaders(res, origin);
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Forbidden' });
  }

  // ── Method check ────────────────────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── CORS origin check ──────────────────────────────────────────────────
  if (!isOriginAllowed(origin)) {
    return res.status(403).json({ error: 'Forbidden: origin not allowed' });
  }
  setCorsHeaders(res, origin);

  // ── Body size check ─────────────────────────────────────────────────────
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 10240) { // 10 KB
    return res.status(413).json({ error: 'Request body too large.' });
  }

  // ── Rate limiting ───────────────────────────────────────────────────────
  const ip = req.headers['x-vercel-forwarded-for'] || req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

  if (isRateLimited(ip)) {
    res.setHeader('Retry-After', String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)));
    return res.status(429).json({
      error: 'Too many messages sent. Please wait 15 minutes and try again.',
    });
  }

  // ── Input validation ────────────────────────────────────────────────────
  const { name, email, subject, message } = req.body ?? {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email, and message are required.' });
  }

  if ([name, email, message, subject].some(v => v !== undefined && typeof v !== 'string')) {
    return res.status(400).json({ error: 'Invalid input.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  if (
    name.length    > 100 ||
    email.length   > 254 ||
    (subject && subject.length > 200) ||
    message.length > 5000
  ) {
    return res.status(400).json({ error: 'Input exceeds maximum length.' });
  }

  // ── Honeypot ────────────────────────────────────────────────────────────
  if (req.body.website) {
    return res.json({ success: true, message: 'Message sent successfully.' });
  }

  // ── Send email ──────────────────────────────────────────────────────────
  const mailOptions = {
    from:    `"Portfolio Contact" <${process.env.SMTP_USER}>`,
    to:      process.env.CONTACT_TO || 'goelumangcareers@gmail.com',
    replyTo: email,
    subject: subject ? `[Portfolio] ${subject}` : `[Portfolio] New message from ${name}`,
    text:    `Name: ${name}\nEmail: ${email}\n\n${message}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;">
        <h2 style="color:#C8A84B;border-bottom:1px solid #C8A84B;padding-bottom:8px;">
          New Portfolio Message
        </h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
        ${subject ? `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>` : ''}
        <hr style="border-color:#eee;"/>
        <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: 'Message sent successfully.' });
  } catch (err) {
    console.error('Email send error:', err.message);
    return res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
};
