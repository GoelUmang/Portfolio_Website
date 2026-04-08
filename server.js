require('dotenv').config();

const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const rateLimit   = require('express-rate-limit');
const compression = require('compression');
const nodemailer  = require('nodemailer');
const crypto      = require('crypto');
const path        = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// ── Public directory ─────────────────────────────────────────────────────────
const PUBLIC_DIR = path.join(__dirname, 'public');

// ── Security headers (helmet) ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'unsafe-inline'", 'https://esm.sh'],
      styleSrc:       ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:        ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:         ["'self'", 'data:', 'blob:', 'https://prod.spline.design'],
      connectSrc:     ["'self'", 'https://cdn.jsdelivr.net', 'https://esm.sh', 'https://prod.spline.design'],
      workerSrc:      ["'self'", 'blob:', 'https://esm.sh'],
      frameSrc:       ["'none'"],
      objectSrc:      ["'none'"],
      ...(isProd ? { upgradeInsecureRequests: [] } : {}),
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ── CORS — same-origin only in production ────────────────────────────────────
const allowedOrigins = isProd
  ? [process.env.ORIGIN].filter(Boolean)
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
}));

// ── Body parsing — cap at 10 KB ──────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const contactLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              5,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: { error: 'Too many messages sent. Please wait 15 minutes and try again.' },
  skipSuccessfulRequests: false,
});

// ── CSRF token store (in-memory, single-use, 1-hour TTL) ────────────────────
const csrfTokens = new Map(); // token → expiry (ms)

function pruneExpiredTokens() {
  const now = Date.now();
  for (const [token, expiry] of csrfTokens) {
    if (now > expiry) csrfTokens.delete(token);
  }
}

app.get('/api/csrf-token', (_req, res) => {
  pruneExpiredTokens();
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(token, Date.now() + 60 * 60 * 1000); // 1 hour
  res.json({ token });
});

// ── Static files — served exclusively from public/ ───────────────────────────
app.use(express.static(PUBLIC_DIR, {
  dotfiles: 'deny',
  index:    'index.html',
  etag:     true,
  maxAge:   isProd ? '1d' : 0,
}));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// ── Nodemailer transporter ───────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── POST /api/contact ────────────────────────────────────────────────────────
app.post('/api/contact', contactLimiter, async (req, res) => {
  // CSRF verification
  const csrfHeader = req.headers['x-csrf-token'];
  const tokenExpiry = csrfTokens.get(csrfHeader);
  if (!csrfHeader || !tokenExpiry || Date.now() > tokenExpiry) {
    return res.status(403).json({ error: 'Invalid or expired session. Please refresh and try again.' });
  }
  csrfTokens.delete(csrfHeader); // single-use

  const { name, email, subject, message } = req.body ?? {};

  // Presence check
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email, and message are required.' });
  }

  // Type check — all must be strings
  if ([name, email, message, subject].some(v => v !== undefined && typeof v !== 'string')) {
    return res.status(400).json({ error: 'Invalid input.' });
  }

  // Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // Length limits
  if (
    name.length    > 100 ||
    email.length   > 254 ||
    (subject && subject.length > 200) ||
    message.length > 5000
  ) {
    return res.status(400).json({ error: 'Input exceeds maximum length.' });
  }

  // Honeypot field — bots fill this, humans don't
  if (req.body.website) {
    return res.json({ success: true, message: 'Message sent successfully.' });
  }

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
    log('error', 'Email send error', err.message);
    return res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

// ── Fallback → index.html ────────────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  log('error', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: isProd ? 'An error occurred.' : err.message,
  });
});

// ── Start (skipped when imported by Vercel serverless) ───────────────────────
if (require.main === module) {
  const HOST = isProd ? '0.0.0.0' : '127.0.0.1';
  const server = app.listen(PORT, HOST, () => {
    log('info', `Portfolio server running → http://localhost:${PORT} [${isProd ? 'production' : 'development'}]`);
  });

  server.on('error', err => {
    if (err.code === 'EADDRINUSE') {
      log('error', `Port ${PORT} is already in use. Run: lsof -ti :${PORT} | xargs kill -9`);
      process.exit(1);
    } else {
      throw err;
    }
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  function shutdown(signal) {
    log('info', `${signal} received — shutting down gracefully`);
    server.close(() => {
      log('info', 'Server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

module.exports = app;

// ── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function log(level, ...args) {
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : 'log'](`[${ts}] [${level.toUpperCase()}]`, ...args);
}
