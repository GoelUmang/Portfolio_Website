const crypto = require('crypto');

// In-memory CSRF store (per serverless instance — acceptable for basic protection)
const csrfTokens = new Map();

function pruneExpiredTokens() {
  const now = Date.now();
  for (const [token, expiry] of csrfTokens) {
    if (now > expiry) csrfTokens.delete(token);
  }
}

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  pruneExpiredTokens();
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(token, Date.now() + 60 * 60 * 1000);
  res.json({ token });
};

// Export for use by contact endpoint
module.exports.csrfTokens = csrfTokens;
