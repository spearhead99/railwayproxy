const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

console.log('🔒 Allowed origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('Not allowed by CORS'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'BTCC API Proxy is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'BTCC API Proxy',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      balance: '/proxy/balance?marketType=spot',
      history: '/proxy/history?marketType=spot&symbol=BTC_USDT',
      trade: '/proxy/trade'
    },
    btccApi: 'https://api.btcc.com'
  });
});

// Proxy endpoint for BTCC API
app.all('/proxy/*', async (req, res) => {
  try {
    const proxyPath = req.params[0];
    const btccBaseUrl = 'https://api.btcc.com';
    const targetUrl = `${btccBaseUrl}/${proxyPath}${req.url.split('?')[1] ? '?' + req.url.split('?')[1] : ''}`;

    console.log(`📡 Proxying ${req.method} request to: ${targetUrl}`);

    // Forward all headers from the original request
    const headers = { ...req.headers };
    delete headers.host; // Remove host header
    delete headers['content-length']; // Let fetch calculate this

    // Make request to BTCC API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeout);

    // Get response data
    const data = await response.text();
    
    console.log(`✅ BTCC API responded: ${response.status}`);

    // Forward response
    res.status(response.status);
    
    // Forward response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.send(data);

  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    res.status(500).json({
      error: 'Proxy request failed',
      message: error.message,
      details: 'Could not reach BTCC API'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BTCC API Proxy running on port ${PORT}`);
  console.log(`📡 Forwarding requests to: https://api.btcc.com`);
});
