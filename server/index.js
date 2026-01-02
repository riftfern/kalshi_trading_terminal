/**
 * Kalshi Terminal Backend Server
 * Proxies requests to Kalshi API with authentication
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { KalshiClient } from './api/KalshiClient.js';
import { startTelegramBot } from './telegram.js';
import { setupWebSocket } from './websocket.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Kalshi client
const client = new KalshiClient();
let clientReady = false;

async function initClient() {
  try {
    clientReady = await client.init();
    console.log(clientReady ? 'Kalshi API connected' : 'Kalshi API connection failed');
  } catch (err) {
    console.error('Failed to initialize Kalshi client:', err.message);
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    kalshi: clientReady ? 'connected' : 'disconnected',
    environment: client.config?.env || 'unknown'
  });
});

// Get connection status
app.get('/api/status', async (req, res) => {
  try {
    const status = client.getStatus();
    let balance = null;

    if (clientReady) {
      try {
        balance = await client.getBalance();
      } catch (e) {
        // Balance fetch failed, that's ok
      }
    }

    res.json({ ...status, balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get markets
app.get('/api/markets', async (req, res) => {
  try {
    const { limit = 200, cursor, status = 'open' } = req.query;
    const result = await client.getMarkets({ limit: parseInt(limit), cursor, status });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all markets (paginated)
app.get('/api/markets/all', async (req, res) => {
  try {
    let allMarkets = [];
    let cursor = null;
    const limit = 200;
    const maxPages = 10;
    let pages = 0;

    do {
      const result = await client.getMarkets({ limit, cursor, status: 'open' });
      allMarkets = allMarkets.concat(result.markets || []);
      cursor = result.cursor;
      pages++;
    } while (cursor && pages < maxPages);

    res.json({ markets: allMarkets, total: allMarkets.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single market
app.get('/api/markets/:ticker', async (req, res) => {
  try {
    const market = await client.getMarket(req.params.ticker);
    res.json(market);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get orderbook
app.get('/api/markets/:ticker/orderbook', async (req, res) => {
  try {
    const { depth = 10 } = req.query;
    const orderbook = await client.getOrderbook(req.params.ticker, parseInt(depth));
    res.json(orderbook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get events
app.get('/api/events', async (req, res) => {
  try {
    const { limit = 200, cursor } = req.query;
    const result = await client.getEvents({ limit: parseInt(limit), cursor });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single event
app.get('/api/events/:ticker', async (req, res) => {
  try {
    const event = await client.getEvent(req.params.ticker);
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search markets
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    const results = await client.searchMarkets(q);
    res.json({ markets: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Portfolio endpoints (for future trading features)
app.get('/api/portfolio/balance', async (req, res) => {
  try {
    const balance = await client.getBalance();
    res.json(balance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/portfolio/positions', async (req, res) => {
  try {
    const positions = await client.getPositions();
    res.json(positions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create HTTP server (needed for WebSocket)
const server = createServer(app);

// Start server
initClient().then(async () => {
  // Setup WebSocket for real-time updates
  setupWebSocket(server, client);

  server.listen(PORT, () => {
    console.log(`Godel Terminal server running on http://localhost:${PORT}`);
    console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
  });

  // Start Telegram bot if token is configured
  if (process.env.TELEGRAM_BOT_TOKEN) {
    await startTelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  }
});
