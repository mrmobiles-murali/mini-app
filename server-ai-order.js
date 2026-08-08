const axios = require('axios');
const rateLimit = require('express-rate-limit');

// Simple rate limiter for AI endpoint (6 req/min per IP)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  message: { ok: false, error: 'Too many requests, slow down.' }
});

function saveJsonArray(filePath, entry) {
  let arr = [];
  if (fs.existsSync(filePath)) {
    try { arr = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]'); } catch(e) { arr = []; }
  }
  arr.push(entry);
  fs.writeFileSync(filePath, JSON.stringify(arr, null, 2));
}

// POST /ai-query
app.post('/ai-query', aiLimiter, verifyInitDataMiddleware, async (req, res) => {
  const { message, history } = req.body || {};
  if (!message || typeof message !== 'string') return res.status(400).json({ ok: false, error: 'message required' });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ ok: false, error: 'server misconfigured (OPENAI_API_KEY missing)' });
  }

  const messages = [
    { role: 'system', content: 'You are a helpful assistant for a Telegram merchant mini-app. Keep replies concise, suggest product options with price, and include clear CTA for ordering (e.g., "Order: P-1001").' }
  ];

  if (Array.isArray(history)) history.forEach(h => { if (h.role && h.content) messages.push(h); });
  messages.push({ role: 'user', content: message });

  try {
    const openaiResp = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 480,
      temperature: 0.2
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
    });

    const assistant = openaiResp.data?.choices?.[0]?.message?.content || 'Sorry, I could not formulate a reply.';
    const logDir = path.join(__dirname, 'data'); if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
    saveJsonArray(path.join(logDir, 'ai_queries.json'), { init_data: getInitDataFromReq(req), message, assistant, timestamp: new Date().toISOString() });

    return res.json({ ok: true, reply: assistant });
  } catch (err) {
    console.error('OpenAI error', err?.response?.data || err.message);
    return res.status(502).json({ ok: false, error: 'AI provider error' });
  }
});

// POST /order
app.post('/order', verifyInitDataMiddleware, async (req, res) => {
  const order = req.body || {};
  const required = ['productId','quantity','name','contact'];
  for (const r of required) if (!order[r]) return res.status(400).json({ ok: false, error: `${r} required` });

  const dataDir = path.join(__dirname, 'data'); if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  const orderEntry = {
    id: `ord_${Date.now()}`,
    productId: order.productId,
    quantity: order.quantity,
    name: order.name,
    contact: order.contact,
    notes: order.notes || '',
    init_data: getInitDataFromReq(req),
    receivedAt: new Date().toISOString()
  };

  try {
    saveJsonArray(path.join(dataDir, 'orders.json'), orderEntry);

    // Notify admin via Telegram Bot if configured (non-blocking)
    if (process.env.BOT_TOKEN && process.env.ADMIN_CHAT_ID) {
      const text = `📦 New order: ${orderEntry.id}\nProduct: ${orderEntry.productId}\nQty: ${orderEntry.quantity}\nName: ${orderEntry.name}\nContact: ${orderEntry.contact}\nNotes: ${orderEntry.notes}`;
      axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        chat_id: process.env.ADMIN_CHAT_ID,
        text
      }).catch(e => console.error('Failed to notify admin via Telegram', e?.response?.data || e.message));
    }

    return res.json({ ok: true, orderId: orderEntry.id });
  } catch (err) {
    console.error('Order save failed', err);
    return res.status(500).json({ ok: false, error: 'failed to save order' });
  }
});
