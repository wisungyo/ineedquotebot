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
-   PostgreSQL (on Render)
-   Telegram Bot API
-   ZenQuotes API
-   Node-cron for scheduling

## Requirements

-   Node.js (v14 or higher recommended)
-   Telegram Bot Token (Get it from [BotFather](https://t.me/botfather))
-   Environment variables set up

## Setup and Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd letsgo
```

2. **Install dependencies**

```bash
npm install
```

3. **Create a .env file with the following variables**

```
TELEGRAM_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
ADMIN_CHAT_ID=your_admin_chat_id
ZENQUOTES_API_URL=https://zenquotes.io/api
DATABASE_URL=postgres://username:password@host:port/database_name
PORT=3000
```

4. **Initialize the database**

```bash
npm run migrate
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

The bot includes a simple Express server, making it ready for deployment on platforms like Render.

### Setting Up a PostgreSQL Database on Render

1. Create a new PostgreSQL database service on Render
2. Copy the internal connection URL provided by Render
3. Add this URL as `DATABASE_URL` in your environment variables
4. Run the migration script to set up the database schema:

```bash
npm run migrate
```

### For a Complete Render Deployment:

1. Create a web service pointing to your repository
2. Set all necessary environment variables
3. Include the following commands in your Render dashboard:
    - Build command: `npm install`
    - Start command: `npm start`
4. Use a PostgreSQL add-on from Render or an external database service

## Contributing

Contributions are welcome! Feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the package.json file for details.
