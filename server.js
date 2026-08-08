// server.js
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || ''; // must be set for verification

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve built static files from dist (after running npm run build)
app.use(express.static(path.join(__dirname, 'dist')));

// ------------------------------
// Telegram init_data verification
// ------------------------------
function verifyTelegramInitData(initData, botToken) {
  if (!initData || !botToken) return false;

  // Parse into key/value pairs
  const params = initData.split('&').reduce((acc, pair) => {
    const [k, v] = pair.split('=');
    if (k && typeof v !== 'undefined') acc[k] = decodeURIComponent(v);
    return acc;
  }, {});

  const hash = params.hash || params.signature || null;
  if (!hash) return false;

  // Remove hash from data to compute message
  delete params.hash;
  delete params.signature;

  // Create message string with keys sorted
  const message = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('\n');

  // Secret is sha256(bot_token)
  const secret = crypto.createHash('sha256').update(botToken).digest();

  const computed = crypto.createHmac('sha256', secret).update(message).digest('hex');

  // Use timing-safe compare when possible
  try {
    const a = Buffer.from(computed, 'hex');
    const b = Buffer.from(hash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    // If hash isn't hex, fall back to constant-time-like compare
    return computed === hash;
  }
}

function getInitDataFromReq(req) {
  // Accept init_data from body.init_data, header x-telegram-initdata, or query.init_data
  return (req.body && req.body.init_data) ||
         req.headers['x-telegram-initdata'] ||
         req.query.init_data ||
         '';
}

function verifyInitDataMiddleware(req, res, next) {
  const initData = getInitDataFromReq(req);

  if (!BOT_TOKEN) {
    console.error('BOT_TOKEN not set in environment — cannot verify init_data.');
    return res.status(500).json({ ok: false, error: 'server misconfigured (BOT_TOKEN missing)' });
  }

  if (!initData) {
    return res.status(401).json({ ok: false, error: 'init_data required' });
  }

  const ok = verifyTelegramInitData(initData, BOT_TOKEN);
  if (!ok) {
    return res.status(403).json({ ok: false, error: 'invalid init_data signature' });
  }

  // If you want to expose parsed initData to downstream handlers, attach it:
  req.telegramInitData = initData;
  next();
}

// ------------------------------
// Example endpoints
// ------------------------------

// Optional testing endpoint (no verification) - keep for dev use
app.post('/verify-init', (req, res) => {
  const { init_data, bot_token } = req.body || {};
  if (!init_data || !bot_token) {
    return res.status(400).json({ ok: false, error: 'init_data and bot_token are required in JSON body' });
  }
  const ok = verifyTelegramInitData(init_data, bot_token);
  return res.json({ ok });
});

// POST /send-data expects verified init_data (middleware)
app.post('/send-data', verifyInitDataMiddleware, (req, res) => {
  const payload = req.body || {};
  console.log('Received /send-data from verified user:', payload);

  // Example: process or store payload
  // e.g., forward to bot backend, persist to DB, etc.

  return res.json({ ok: true, received: payload });
});

// POST /feedback expects verified init_data (middleware)
app.post('/feedback', verifyInitDataMiddleware, (req, res) => {
  const feedback = req.body || {};
  const name = feedback.name && String(feedback.name).trim();
  const message = feedback.message && String(feedback.message).trim();

  if (!name || !message) {
    return res.status(400).json({ ok: false, error: 'name and message are required' });
  }

  const dataDir = path.join(__dirname, 'data');
  const filePath = path.join(dataDir, 'feedbacks.json');

  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

    let arr = [];
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      arr = raw ? JSON.parse(raw) : [];
    }

    const entry = {
      name,
      message,
      userInitData: getInitDataFromReq(req), // keep the init_data for reference (or parse it)
      receivedAt: new Date().toISOString()
    };

    arr.push(entry);
    fs.writeFileSync(filePath, JSON.stringify(arr, null, 2));

    console.log('Saved feedback from verified user:', entry);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Failed to save feedback', err);
    return res.status(500).json({ ok: false, error: 'failed to save feedback' });
  }
});

// Fallback: serve index.html from dist
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log('Static files served from /dist; ensure you ran `npm run build`');
});
