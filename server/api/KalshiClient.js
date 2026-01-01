/**
 * Kalshi REST API Client
 */

import https from 'https';
import { createAuthHeaders, loadPrivateKey, loadAuthConfig } from './auth.js';

const BASE_URLS = {
  prod: 'https://api.elections.kalshi.com',
  demo: 'https://demo-api.kalshi.com'
};

const API_PATH = '/trade-api/v2';

export class KalshiClient {
  constructor(config = null) {
    this.config = config || loadAuthConfig();
    this.baseUrl = BASE_URLS[this.config.env] || BASE_URLS.demo;
    this.privateKey = null;
    this.connected = false;
    this.lastError = null;
  }

  /**
   * Initialize the client by loading the private key
   */
  async init() {
    try {
      this.privateKey = loadPrivateKey(this.config);
      // Test connection
      await this.getExchange();
      this.connected = true;
      return true;
    } catch (err) {
      this.lastError = err.message;
      this.connected = false;
      return false;
    }
  }

  /**
   * Make an authenticated API request
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint (without base path)
   * @param {Object} params - Query parameters or body
   * @returns {Promise<Object>} Response data
   */
  async request(method, endpoint, params = null) {
    const path = `${API_PATH}${endpoint}`;
    let fullPath = path;
    let body = null;

    // Add query params for GET, body for others
    if (params) {
      if (method === 'GET') {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (value != null) {
            query.append(key, value);
          }
        }
        const queryStr = query.toString();
        if (queryStr) {
          fullPath += `?${queryStr}`;
        }
      } else {
        body = JSON.stringify(params);
      }
    }

    const headers = createAuthHeaders(
      this.privateKey,
      this.config.apiKey,
      method,
      path
    );

    const url = `${this.baseUrl}${fullPath}`;

    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method,
        family: 4, // Force IPv4
        headers,
        timeout: 30000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
          } else {
            let errorMessage;
            try {
              const errorJson = JSON.parse(data);
              errorMessage = errorJson.message || errorJson.error || data;
            } catch {
              errorMessage = data;
            }
            reject(new Error(`API Error (${res.statusCode}): ${errorMessage}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });

      if (body) {
        req.write(body);
      }
      req.end();
    });
  }

  // ========== Exchange Info ==========

  /**
   * Get exchange status
   */
  async getExchange() {
    return this.request('GET', '/exchange/status');
  }

  // ========== Markets ==========

  /**
   * Get list of markets
   * @param {Object} params - Filter parameters
   * @param {string} params.status - Market status (open, closed, settled)
   * @param {string} params.series_ticker - Filter by series
   * @param {number} params.limit - Max results (default 100)
   * @param {string} params.cursor - Pagination cursor
   */
  async getMarkets(params = {}) {
    const result = await this.request('GET', '/markets', {
      limit: params.limit || 100,
      status: params.status || 'open',
      series_ticker: params.series_ticker,
      cursor: params.cursor
    });
    return result;
  }

  /**
   * Get single market by ticker
   * @param {string} ticker - Market ticker
   */
  async getMarket(ticker) {
    const result = await this.request('GET', `/markets/${ticker}`);
    return result.market;
  }

  /**
   * Get market orderbook
   * @param {string} ticker - Market ticker
   * @param {number} depth - Number of price levels (default 10)
   */
  async getOrderbook(ticker, depth = 10) {
    const result = await this.request('GET', `/markets/${ticker}/orderbook`, { depth });
    return result.orderbook;
  }

  // ========== Events ==========

  /**
   * Get events (market categories/series)
   * @param {Object} params - Filter parameters
   */
  async getEvents(params = {}) {
    return this.request('GET', '/events', params);
  }

  /**
   * Get single event
   * @param {string} eventTicker - Event ticker
   */
  async getEvent(eventTicker) {
    const result = await this.request('GET', `/events/${eventTicker}`);
    return result.event;
  }

  // ========== Portfolio ==========

  /**
   * Get account balance
   */
  async getBalance() {
    return this.request('GET', '/portfolio/balance');
  }

  /**
   * Get positions
   * @param {Object} params - Filter parameters
   */
  async getPositions(params = {}) {
    return this.request('GET', '/portfolio/positions', params);
  }

  /**
   * Get open orders
   * @param {Object} params - Filter parameters
   */
  async getOrders(params = {}) {
    return this.request('GET', '/portfolio/orders', params);
  }

  /**
   * Get trade fills
   * @param {Object} params - Filter parameters
   */
  async getFills(params = {}) {
    return this.request('GET', '/portfolio/fills', params);
  }

  // ========== Trading ==========

  /**
   * Create an order
   * @param {Object} order - Order parameters
   * @param {string} order.ticker - Market ticker
   * @param {string} order.side - 'yes' or 'no'
   * @param {string} order.action - 'buy' or 'sell'
   * @param {string} order.type - 'limit' or 'market'
   * @param {number} order.count - Number of contracts
   * @param {number} order.yes_price - Price in cents (for limit orders)
   */
  async createOrder(order) {
    return this.request('POST', '/portfolio/orders', order);
  }

  /**
   * Cancel an order
   * @param {string} orderId - Order ID to cancel
   */
  async cancelOrder(orderId) {
    return this.request('DELETE', `/portfolio/orders/${orderId}`);
  }

  /**
   * Cancel all orders
   * @param {Object} params - Optional filter (e.g., ticker)
   */
  async cancelAllOrders(params = {}) {
    return this.request('DELETE', '/portfolio/orders', params);
  }

  // ========== Search ==========

  /**
   * Search markets by text
   * @param {string} query - Search query
   */
  async searchMarkets(query) {
    // Kalshi doesn't have a direct search endpoint, so we fetch markets
    // and filter client-side
    const result = await this.getMarkets({ limit: 200 });
    const markets = result.markets || [];
    const lowerQuery = query.toLowerCase();

    return markets.filter(m =>
      m.ticker.toLowerCase().includes(lowerQuery) ||
      m.title.toLowerCase().includes(lowerQuery) ||
      (m.subtitle && m.subtitle.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get connection status info
   */
  getStatus() {
    return {
      connected: this.connected,
      environment: this.config.env,
      baseUrl: this.baseUrl,
      lastError: this.lastError
    };
  }
}

// Singleton instance
let clientInstance = null;

/**
 * Get or create the Kalshi client instance
 */
export function getClient() {
  if (!clientInstance) {
    clientInstance = new KalshiClient();
  }
  return clientInstance;
}
