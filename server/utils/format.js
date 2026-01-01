/**
 * Formatting utilities for KalshiTerminal
 */

/**
 * Format cents to dollar string
 * @param {number} cents - Amount in cents
 * @returns {string} Formatted dollar amount
 */
export function formatCents(cents) {
  if (cents == null) return '-';
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}

/**
 * Format a price (0-100 scale used by Kalshi for binary markets)
 * @param {number} price - Price in cents (0-100)
 * @returns {string} Formatted price
 */
export function formatPrice(price) {
  if (price == null) return '-';
  return `$${(price / 100).toFixed(2)}`;
}

/**
 * Format large numbers with K/M/B suffixes
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatCompact(num) {
  if (num == null) return '-';
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Format volume in dollars
 * @param {number} volume - Volume in cents
 * @returns {string} Formatted volume
 */
export function formatVolume(volume) {
  if (volume == null) return '-';
  return `$${formatCompact(volume / 100)}`;
}

/**
 * Format a date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a datetime for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted datetime
 */
export function formatDateTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format percentage change
 * @param {number} change - Change amount
 * @param {number} base - Base value
 * @returns {string} Formatted percentage
 */
export function formatPercentChange(change, base) {
  if (change == null || base == null || base === 0) return '-';
  const pct = (change / base) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

/**
 * Format spread as percentage
 * @param {number} bid - Bid price in cents
 * @param {number} ask - Ask price in cents
 * @returns {string} Formatted spread
 */
export function formatSpread(bid, ask) {
  if (bid == null || ask == null) return '-';
  const spread = ask - bid;
  const midpoint = (ask + bid) / 2;
  if (midpoint === 0) return '-';
  const pct = (spread / midpoint) * 100;
  return `$${(spread / 100).toFixed(2)} (${pct.toFixed(1)}%)`;
}

/**
 * Pad a string to a fixed width
 * @param {string} str - String to pad
 * @param {number} width - Target width
 * @param {string} align - 'left', 'right', or 'center'
 * @returns {string} Padded string
 */
export function pad(str, width, align = 'left') {
  str = String(str);
  if (str.length >= width) return str.slice(0, width);
  const padding = width - str.length;
  switch (align) {
    case 'right':
      return ' '.repeat(padding) + str;
    case 'center':
      const left = Math.floor(padding / 2);
      const right = padding - left;
      return ' '.repeat(left) + str + ' '.repeat(right);
    default:
      return str + ' '.repeat(padding);
  }
}

/**
 * Truncate a string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLen - Maximum length
 * @returns {string} Truncated string
 */
export function truncate(str, maxLen) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

/**
 * Create a horizontal bar for visualization
 * @param {number} value - Current value
 * @param {number} max - Maximum value
 * @param {number} width - Bar width in characters
 * @param {string} char - Character to use for the bar
 * @returns {string} ASCII bar
 */
export function bar(value, max, width = 20, char = '█') {
  if (!max || max === 0) return '';
  const filled = Math.round((value / max) * width);
  return char.repeat(Math.min(filled, width));
}

/**
 * Format current date for header
 * @returns {string} Current date string
 */
export function currentDate() {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}
