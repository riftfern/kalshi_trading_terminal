/**
 * WebSocket Server for real-time market data
 *
 * Manages subscriptions to market tickers and broadcasts
 * orderbook and market updates to connected clients.
 */

import { WebSocketServer, WebSocket } from 'ws';

const POLL_INTERVAL = 1000; // Poll Kalshi API every second for subscribed tickers

/**
 * Set up WebSocket server
 * @param {import('http').Server} server - HTTP server instance
 * @param {import('./api/KalshiClient.js').KalshiClient} kalshiClient - Kalshi API client
 */
export function setupWebSocket(server, kalshiClient) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Track subscriptions: ticker -> { clients: Set<WebSocket>, pollInterval, lastData }
  const subscriptions = new Map();

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    // Track this client's subscriptions for cleanup
    ws.subscriptions = new Set();

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());

        switch (msg.type) {
          case 'subscribe':
            if (msg.ticker) {
              handleSubscribe(ws, msg.ticker);
            }
            break;

          case 'unsubscribe':
            if (msg.ticker) {
              handleUnsubscribe(ws, msg.ticker);
            }
            break;

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;

          default:
            console.log('Unknown WebSocket message type:', msg.type);
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');

      // Clean up all subscriptions for this client
      ws.subscriptions.forEach(ticker => {
        handleUnsubscribe(ws, ticker);
      });
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });

    // Send connection confirmation
    ws.send(JSON.stringify({ type: 'connected' }));
  });

  /**
   * Handle subscription request
   */
  function handleSubscribe(ws, ticker) {
    let sub = subscriptions.get(ticker);

    if (!sub) {
      // Create new subscription
      sub = {
        clients: new Set(),
        lastData: null,
        pollInterval: null,
      };
      subscriptions.set(ticker, sub);

      // Start polling for this ticker
      const pollData = async () => {
        try {
          const [orderbook, market] = await Promise.all([
            kalshiClient.getOrderbook(ticker, 10),
            kalshiClient.getMarket(ticker),
          ]);

          const data = {
            ticker,
            orderbook,
            market,
            timestamp: Date.now(),
          };

          sub.lastData = data;

          // Broadcast to all subscribed clients
          const msg = JSON.stringify({ type: 'market-update', data });
          sub.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(msg);
            }
          });
        } catch (err) {
          console.error(`Failed to poll ${ticker}:`, err.message);
        }
      };

      // Initial fetch
      pollData();

      // Start polling interval
      sub.pollInterval = setInterval(pollData, POLL_INTERVAL);
    }

    // Add client to subscription
    sub.clients.add(ws);
    ws.subscriptions.add(ticker);

    // Send last known data immediately
    if (sub.lastData) {
      ws.send(JSON.stringify({ type: 'market-update', data: sub.lastData }));
    }

    ws.send(JSON.stringify({ type: 'subscribed', ticker }));
    console.log(`Client subscribed to ${ticker} (${sub.clients.size} subscribers)`);
  }

  /**
   * Handle unsubscription request
   */
  function handleUnsubscribe(ws, ticker) {
    const sub = subscriptions.get(ticker);

    if (sub) {
      sub.clients.delete(ws);
      ws.subscriptions.delete(ticker);

      // If no more subscribers, stop polling
      if (sub.clients.size === 0) {
        if (sub.pollInterval) {
          clearInterval(sub.pollInterval);
        }
        subscriptions.delete(ticker);
        console.log(`No more subscribers for ${ticker}, stopped polling`);
      }
    }

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'unsubscribed', ticker }));
    }
  }

  // Periodic cleanup of dead connections
  const cleanupInterval = setInterval(() => {
    wss.clients.forEach(ws => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.subscriptions?.forEach(ticker => {
          handleUnsubscribe(ws, ticker);
        });
      }
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(cleanupInterval);

    // Clear all polling intervals
    subscriptions.forEach(sub => {
      if (sub.pollInterval) {
        clearInterval(sub.pollInterval);
      }
    });
  });

  console.log('WebSocket server initialized on /ws');

  return wss;
}
