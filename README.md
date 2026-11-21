# I Need Quote Bot 🧠💭

A Telegram bot that delivers daily inspirational quotes and allows users to request quotes on demand. Keep motivated with a fresh quote every day or get a random quote whenever you need inspiration! Find the bot on Telegram @ineedquotebot.

## Preview

<img src="https://raw.githubusercontent.com/wisungyo/ineedquotebot/master/images/ineedquote.jpeg" alt="I Need Quote Bot Preview" style="height: 1000px;">

_Screenshot of the bot in action_

## Features

-   **Daily Quote**: Automatically sends a quote of the day every morning at 6 AM
-   **On-Demand Quotes**: Request today's quote or a random quote at any time
-   **Subscription System**: Users can subscribe to receive daily quotes automatically
-   **Fallback Mechanism**: Uses a local database of quotes when the API is unavailable
-   **Easy to Use**: Simple commands to interact with the bot
-   **Admin Commands**: Special commands for bot administrators to manage subscribers

## Commands

### User Commands

-   `/todayquote` - Get the quote of the day
-   `/randomquote` - Get a random inspirational quote
-   `/subscribe` - Subscribe to receive daily quotes
-   `/unsubscribe` - Unsubscribe from daily quotes

### Admin Commands

-   `/stats` - Get subscriber statistics
-   `/broadcast [message]` - Send a message to all subscribers

## Technologies Used

-   Node.js
-   Express.js
-   PostgreSQL (self-hosted, via `pg`)
-   Telegram Bot API
-   ZenQuotes API
-   Node-cron for scheduling

## Requirements

-   Node.js (v18 or higher recommended)
-   PostgreSQL
-   Telegram Bot Token (Get it from [BotFather](https://t.me/botfather))
-   Environment variables set up

## Setup and Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd ineedquotebot
```

2. **Install dependencies**

```bash
npm install
```

3. **Create a .env file** (copy from `.env.example`)

```
TL_TOKEN=your_telegram_bot_token
TL_ADMIN_CHAT_ID=your_admin_chat_id
ZENQUOTES_API_URL=https://zenquotes.io/api
DATABASE_URL=postgres://user:password@127.0.0.1:5432/ineedquotebot
PORT=3000
HOST=127.0.0.1
CRON_DAILY_QUOTE=0 6 * * *
```

4. **Initialize the database** (optional; the app also creates the table on startup)

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

5. **Start the application**

```bash
npm start
```

## How It Works

The bot connects to the Telegram API and listens for commands. When it receives a command:

-   `/todayquote`: Returns the quote of the day (the same quote for the entire day)
-   `/randomquote`: Fetches a new random quote from the API
-   `/subscribe`: Stores the user's chat ID in the PostgreSQL database for daily quote delivery
-   `/unsubscribe`: Removes the user from the database to stop receiving daily quotes

Additionally, a scheduled task runs every morning at 6 AM to send the quote of the day automatically to all subscribers.

If the external API fails, the bot falls back to its local database of quotes stored in `quotes.json`.

## Deployment

The bot uses long polling, so it needs no domain, SSL, or open port. The Express health endpoint binds to `127.0.0.1` by default (set `HOST=0.0.0.0` to expose it).

### Self-hosted on a VPS (systemd + local PostgreSQL)

1. Install PostgreSQL and create a database and user:

```bash
sudo apt install -y postgresql
sudo -u postgres psql -c "CREATE ROLE quotebot LOGIN PASSWORD 'change-me';"
sudo -u postgres psql -c "CREATE DATABASE ineedquotebot OWNER quotebot;"
```

2. `npm ci --omit=dev`, fill in `.env`, then create `/etc/systemd/system/ineedquotebot.service`:

```ini
[Unit]
Description=ineedquotebot Telegram bot
After=network-online.target postgresql.service
Wants=network-online.target postgresql.service

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/ineedquotebot
EnvironmentFile=/home/ubuntu/ineedquotebot/.env
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

3. Start it and follow the logs:

```bash
sudo systemctl enable --now ineedquotebot
journalctl -u ineedquotebot -f
```

Only run one instance per bot token; two pollers on the same token cause `409 Conflict`.

## Contributing

Contributions are welcome! Feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the package.json file for details.
