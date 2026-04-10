require('dotenv').config();

const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const rateLimit   = require('express-rate-limit');
const compression = require('compression');
const path        = require('path');
const { isOriginAllowed } = require('./lib/utils');

const app  = express();
app.set('trust proxy', 1);

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
const localOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) {
      // In production, block non-browser requests (missing origin header)
      return isProd ? cb(new Error('Not allowed by CORS: Origin header missing')) : cb(null, true);
    }
    if (isOriginAllowed(origin) || (!isProd && localOrigins.includes(origin))) {
      return cb(null, true);
    }
    cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
}));

// ── Body parsing — cap at 10 KB ──────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── Global Rate limiting for DDoS protection ──────────────────────────────────
const globalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              500, // Limit each IP to 500 requests per `window`
  standardHeaders:  true,
  legacyHeaders:    false,
  message: { error: 'Too many requests from this IP, please try again later.' },
});
app.use(globalLimiter);

// ── Contact Rate limiting ─────────────────────────────────────────────────────
const contactLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              5,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: { error: 'Too many messages sent. Please wait 15 minutes and try again.' },
  skipSuccessfulRequests: false,
});

// CSRF Token functionality has been removed because it is incompatible with 
// unauthenticated public endpoints and serverless memory environments.

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

// ── Views endpoint ───────────────────────────────────────────────────────────
app.all('/api/views', require('./api/views'));

// ── Contact endpoint ─────────────────────────────────────────────────────────
app.all('/api/contact', contactLimiter, require('./api/contact'));

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



function log(level, ...args) {
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : 'log'](`[${ts}] [${level.toUpperCase()}]`, ...args);
}
