# Kalshi Trading Terminal

A Bloomberg-style trading terminal for Kalshi prediction markets. Features a React web interface with terminal aesthetics and Telegram bot integration.

## Features

- Terminal-style web interface
- Real-time market data from Kalshi API
- Orderbook visualization
- Market search and filtering by category/event
- Telegram bot for mobile access

## Commands

| Command | Description |
|---------|-------------|
| `markets [limit]` | List active markets (default: 20) |
| `search <query>` | Search markets by keyword |
| `quote <ticker>` | Get detailed market quote |
| `book <ticker>` | Display orderbook depth |
| `categories` | List all market categories |
| `events [category]` | List events, optionally filtered by category |
| `status` | Check API connection and account balance |
| `help` | Show available commands |
| `clear` | Clear terminal output |

## Setup

### Prerequisites

- Node.js >= 18
- Kalshi API key and private key (RSA)
- Telegram bot token (optional, for bot integration)

### Installation

```bash
# Clone the repository
git clone https://github.com/riftfern/kalshi_trading_terminal.git
cd kalshi_trading_terminal

# Install dependencies
npm install
```

### Configuration

Create `server/.env` with your credentials:

```
KALSHI_API_KEY=your-api-key
KALSHI_PRIVATE_KEY_PATH=/path/to/your/private_key.pem
KALSHI_ENV=prod
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

### Running

```bash
# Start both server and client
npm start

# Or run separately:
npm run server  # Backend on http://localhost:3001
npm run client  # Frontend on http://localhost:3000
```

## Project Structure

```
kalshi_trading_terminal/
├── server/                 # Express backend
│   ├── api/
│   │   ├── auth.js         # RSA-PSS signing for Kalshi API
│   │   └── KalshiClient.js # Kalshi API client
│   ├── index.js            # Express server
│   └── telegram.js         # Telegram bot
│
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Terminal UI components
│   │   ├── commands/       # Command handlers
│   │   └── utils/          # Formatting utilities
│   └── vite.config.js
│
└── package.json
```

## API

The backend proxies requests to the Kalshi API with RSA-PSS authentication. Endpoints:

- `GET /api/markets` - List markets
- `GET /api/markets/:ticker` - Get market details
- `GET /api/markets/:ticker/orderbook` - Get orderbook
- `GET /api/events` - List events
- `GET /api/events/:ticker` - Get event details
- `GET /api/balance` - Get account balance

## Telegram Bot

The Telegram bot supports the same commands as the web terminal:

- `/markets` - List markets
- `/search <query>` - Search markets
- `/quote <ticker>` - Get quote
- `/book <ticker>` - Get orderbook
- `/categories` - List categories
- `/events [category]` - List events
- `/status` - Check connection

## License

MIT
