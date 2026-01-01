/**
 * Kalshi API Authentication
 * Uses RSA-PSS signatures for request signing
 */

import crypto from 'crypto';
import fs from 'fs';

/**
 * Load private key from file or environment
 * @param {Object} config - Configuration object
 * @returns {string} PEM-formatted private key
 */
export function loadPrivateKey(config) {
  // Try path first
  if (config.privateKeyPath) {
    try {
      return fs.readFileSync(config.privateKeyPath, 'utf8');
    } catch (err) {
      throw new Error(`Failed to load private key from ${config.privateKeyPath}: ${err.message}`);
    }
  }

  // Try base64 encoded key
  if (config.privateKeyBase64) {
    return Buffer.from(config.privateKeyBase64, 'base64').toString('utf8');
  }

  // Try raw PEM key
  if (config.privateKey) {
    return config.privateKey;
  }

  throw new Error('No private key configured. Set KALSHI_PRIVATE_KEY_PATH or KALSHI_PRIVATE_KEY_BASE64');
}

/**
 * Create authentication headers for Kalshi API request
 * @param {string} privateKey - PEM-formatted RSA private key
 * @param {string} apiKey - Kalshi API key ID
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - Request path (e.g., /trade-api/v2/markets)
 * @returns {Object} Headers object with authentication
 */
export function createAuthHeaders(privateKey, apiKey, method, path) {
  // Current timestamp in milliseconds
  const timestamp = Date.now().toString();

  // Message to sign: timestamp + method + path
  const message = timestamp + method.toUpperCase() + path;

  // Create RSA-PSS signature
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  sign.end();

  const signature = sign.sign({
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
  }, 'base64');

  return {
    'KALSHI-ACCESS-KEY': apiKey,
    'KALSHI-ACCESS-SIGNATURE': signature,
    'KALSHI-ACCESS-TIMESTAMP': timestamp,
    'Content-Type': 'application/json'
  };
}

/**
 * Auth configuration loader
 * @returns {Object} Configuration with API key and private key
 */
export function loadAuthConfig() {
  const config = {
    apiKey: process.env.KALSHI_API_KEY,
    privateKeyPath: process.env.KALSHI_PRIVATE_KEY_PATH,
    privateKeyBase64: process.env.KALSHI_PRIVATE_KEY_BASE64,
    privateKey: process.env.KALSHI_PRIVATE_KEY,
    env: process.env.KALSHI_ENV || 'demo'
  };

  if (!config.apiKey) {
    throw new Error('KALSHI_API_KEY environment variable is required');
  }

  return config;
}
