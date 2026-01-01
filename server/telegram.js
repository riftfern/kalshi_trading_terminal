/**
 * Kalshi Terminal Telegram Bot
 */

import { Telegraf } from 'telegraf';
import { KalshiClient } from './api/KalshiClient.js';

// Formatting helpers
function formatPrice(cents) {
  if (cents == null) return '-';
  return `$${(cents / 100).toFixed(2)}`;
}

function formatVolume(num) {
  if (num == null) return '-';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function startTelegramBot(token) {
  if (!token) {
    console.log('No Telegram bot token provided, skipping bot startup');
    return null;
  }

  const bot = new Telegraf(token);
  const client = new KalshiClient();

  // Initialize Kalshi client
  const connected = await client.init();
  console.log(`Telegram bot Kalshi client: ${connected ? 'connected' : 'disconnected'}`);

  // /start command
  bot.start((ctx) => {
    ctx.reply(
      `🏦 *Kalshi Terminal Bot*\n\n` +
      `Commands:\n` +
      `/markets - List active markets\n` +
      `/search <query> - Search markets\n` +
      `/quote <ticker> - Get market quote\n` +
      `/book <ticker> - Show orderbook\n` +
      `/categories - List categories\n` +
      `/status - Check connection\n` +
      `/help - Show this help`,
      { parse_mode: 'Markdown' }
    );
  });

  // /help command
  bot.help((ctx) => {
    ctx.reply(
      `📋 *Available Commands*\n\n` +
      `/markets [filter] - List markets (optional filter)\n` +
      `/search <query> - Search by keyword\n` +
      `/quote <ticker> - Detailed quote\n` +
      `/book <ticker> - Orderbook depth\n` +
      `/categories - Browse categories\n` +
      `/events <category> - Events in category\n` +
      `/status - API status\n\n` +
      `Example: /quote KXWARMING-50`,
      { parse_mode: 'Markdown' }
    );
  });

  // /status command
  bot.command('status', async (ctx) => {
    const status = client.getStatus();
    let msg = `📡 *Connection Status*\n\n` +
      `Status: ${status.connected ? '🟢 Connected' : '🔴 Disconnected'}\n` +
      `Environment: ${status.environment}\n`;

    if (status.connected) {
      try {
        const balance = await client.getBalance();
        msg += `Balance: $${(balance.balance / 100).toFixed(2)}`;
      } catch (e) {
        // Balance fetch failed
      }
    }

    ctx.reply(msg, { parse_mode: 'Markdown' });
  });

  // /markets command
  bot.command('markets', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    const filter = args.join(' ').toLowerCase();

    ctx.reply('⏳ Fetching markets...');

    try {
      let allMarkets = [];
      let cursor = null;
      let pages = 0;

      do {
        const result = await client.getMarkets({ limit: 200, cursor, status: 'open' });
        allMarkets = allMarkets.concat(result.markets || []);
        cursor = result.cursor;
        pages++;
      } while (cursor && pages < 3);

      let markets = allMarkets;
      if (filter) {
        markets = allMarkets.filter(m =>
          m.ticker.toLowerCase().includes(filter) ||
          (m.title && m.title.toLowerCase().includes(filter))
        );
      }

      if (markets.length === 0) {
        ctx.reply('No markets found');
        return;
      }

      // Sort by volume, take top 15
      markets.sort((a, b) => (b.volume_24h || 0) - (a.volume_24h || 0));
      const top = markets.slice(0, 15);

      let msg = `📊 *Markets${filter ? ` (${filter})` : ''}*\n\n`;
      top.forEach(m => {
        msg += `\`${m.ticker}\`\n`;
        msg += `  Bid: ${formatPrice(m.yes_bid)} | Ask: ${formatPrice(m.yes_ask)}\n`;
        msg += `  Vol: ${formatVolume(m.volume_24h)}\n\n`;
      });

      if (markets.length > 15) {
        msg += `_...and ${markets.length - 15} more_`;
      }

      ctx.reply(msg, { parse_mode: 'Markdown' });

    } catch (err) {
      ctx.reply(`❌ Error: ${err.message}`);
    }
  });

  // /search command
  bot.command('search', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ');

    if (!query) {
      ctx.reply('Usage: /search <query>\nExample: /search bitcoin');
      return;
    }

    ctx.reply(`⏳ Searching for "${query}"...`);

    try {
      const results = await client.searchMarkets(query);

      if (results.length === 0) {
        ctx.reply(`No markets found for "${query}"`);
        return;
      }

      results.sort((a, b) => (b.volume_24h || 0) - (a.volume_24h || 0));
      const top = results.slice(0, 10);

      let msg = `🔍 *Search: "${query}"*\n\n`;
      top.forEach(m => {
        msg += `\`${m.ticker}\`\n`;
        msg += `${m.title?.slice(0, 50) || ''}\n`;
        msg += `Bid: ${formatPrice(m.yes_bid)} | Ask: ${formatPrice(m.yes_ask)}\n\n`;
      });

      ctx.reply(msg, { parse_mode: 'Markdown' });

    } catch (err) {
      ctx.reply(`❌ Error: ${err.message}`);
    }
  });

  // /quote command
  bot.command('quote', async (ctx) => {
    const ticker = ctx.message.text.split(' ')[1]?.toUpperCase();

    if (!ticker) {
      ctx.reply('Usage: /quote <ticker>\nExample: /quote KXWARMING-50');
      return;
    }

    ctx.reply(`⏳ Fetching quote for ${ticker}...`);

    try {
      const market = await client.getMarket(ticker);

      const change = market.last_price != null && market.previous_price != null
        ? market.last_price - market.previous_price
        : null;

      let changeStr = '-';
      if (change != null) {
        const sign = change >= 0 ? '+' : '';
        changeStr = `${sign}${formatPrice(change)}`;
      }

      const msg = `📈 *${market.ticker}*\n` +
        `${market.title}\n\n` +
        `*YES Price:* ${formatPrice(market.last_price)}\n` +
        `*NO Price:* ${formatPrice(100 - (market.last_price || 0))}\n` +
        `*24h Change:* ${changeStr}\n\n` +
        `*Bid:* ${formatPrice(market.yes_bid)}\n` +
        `*Ask:* ${formatPrice(market.yes_ask)}\n` +
        `*Spread:* ${formatPrice((market.yes_ask || 0) - (market.yes_bid || 0))}\n\n` +
        `*Volume 24h:* ${formatVolume(market.volume_24h)}\n` +
        `*Open Interest:* ${formatVolume(market.open_interest)}\n` +
        `*Expires:* ${formatDate(market.close_time || market.expiration_time)}\n` +
        `*Status:* ${market.status}`;

      ctx.reply(msg, { parse_mode: 'Markdown' });

    } catch (err) {
      ctx.reply(`❌ Error: ${err.message}`);
    }
  });

  // /book command
  bot.command('book', async (ctx) => {
    const ticker = ctx.message.text.split(' ')[1]?.toUpperCase();

    if (!ticker) {
      ctx.reply('Usage: /book <ticker>\nExample: /book KXWARMING-50');
      return;
    }

    ctx.reply(`⏳ Fetching orderbook for ${ticker}...`);

    try {
      const orderbook = await client.getOrderbook(ticker, 5);
      const bids = orderbook.yes || [];
      const asks = orderbook.no || [];

      let msg = `📖 *Orderbook: ${ticker}*\n\n`;

      msg += `*BIDS (YES)*\n`;
      if (bids.length === 0) {
        msg += `  No bids\n`;
      } else {
        bids.slice(0, 5).forEach(([price, qty]) => {
          msg += `  ${formatVolume(qty)} @ ${formatPrice(price)}\n`;
        });
      }

      msg += `\n*ASKS (NO)*\n`;
      if (asks.length === 0) {
        msg += `  No asks\n`;
      } else {
        asks.slice(0, 5).forEach(([price, qty]) => {
          const yesPrice = 100 - price;
          msg += `  ${formatPrice(yesPrice)} @ ${formatVolume(qty)}\n`;
        });
      }

      ctx.reply(msg, { parse_mode: 'Markdown' });

    } catch (err) {
      ctx.reply(`❌ Error: ${err.message}`);
    }
  });

  // /categories command
  bot.command('categories', async (ctx) => {
    ctx.reply('⏳ Fetching categories...');

    try {
      const result = await client.getEvents({ limit: 200 });
      const events = result.events || [];

      const categories = {};
      events.forEach(e => {
        const cat = e.category || 'Other';
        if (!categories[cat]) categories[cat] = 0;
        categories[cat]++;
      });

      let msg = `📁 *Kalshi Categories*\n\n`;
      Object.entries(categories).sort().forEach(([cat, count]) => {
        msg += `• ${cat} (${count})\n`;
      });

      msg += `\n_Use /events <category> to see events_`;

      ctx.reply(msg, { parse_mode: 'Markdown' });

    } catch (err) {
      ctx.reply(`❌ Error: ${err.message}`);
    }
  });

  // /events command
  bot.command('events', async (ctx) => {
    const category = ctx.message.text.split(' ').slice(1).join(' ').toLowerCase();

    if (!category) {
      ctx.reply('Usage: /events <category>\nExample: /events climate');
      return;
    }

    ctx.reply(`⏳ Fetching ${category} events...`);

    try {
      const result = await client.getEvents({ limit: 200 });
      const events = (result.events || []).filter(e =>
        (e.category || '').toLowerCase().includes(category)
      );

      if (events.length === 0) {
        ctx.reply(`No events found for "${category}"`);
        return;
      }

      let msg = `📁 *${events[0].category}*\n\n`;
      events.slice(0, 15).forEach(e => {
        msg += `\`${e.event_ticker}\`\n${e.title}\n\n`;
      });

      if (events.length > 15) {
        msg += `_...and ${events.length - 15} more_`;
      }

      ctx.reply(msg, { parse_mode: 'Markdown' });

    } catch (err) {
      ctx.reply(`❌ Error: ${err.message}`);
    }
  });

  // Start bot with error handling
  try {
    await bot.launch();
    console.log('Telegram bot started');

    // Graceful shutdown
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (err) {
    console.error('Telegram bot failed to start:', err.message);
    return null;
  }

  return bot;
}
