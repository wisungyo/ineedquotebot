# I Need Quote Bot 🧠💭

A Telegram bot that delivers daily inspirational quotes and allows users to request quotes on demand. Keep motivated with a fresh quote every day or get a random quote whenever you need inspiration!

## Preview

<img src="https://raw.githubusercontent.com/wisungyo/ineedquotebot/master/images/ineedquote.jpeg" alt="I Need Quote Bot Preview" style="height: 100px;">

_Screenshot of the bot in action_

## Features

-   **Daily Quote**: Automatically sends a quote of the day every morning at 6 AM
-   **On-Demand Quotes**: Request today's quote or a random quote at any time
-   **Fallback Mechanism**: Uses a local database of quotes when the API is unavailable
-   **Easy to Use**: Simple commands to interact with the bot

## Commands

-   `/todayquote` - Get the quote of the day
-   `/randomquote` - Get a random inspirational quote

## Technologies Used

-   Node.js
-   Express.js
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
ZENQUOTES_API_URL=https://zenquotes.io/api
PORT=3000
```

4. **Start the application**

```bash
npm start
```

## How It Works

The bot connects to the Telegram API and listens for commands. When it receives a command:

-   `/todayquote`: Returns the quote of the day (the same quote for the entire day)
-   `/randomquote`: Fetches a new random quote from the API

Additionally, a scheduled task runs every morning at 6 AM to send the quote of the day automatically.

If the external API fails, the bot falls back to its local database of quotes stored in `quotes.json`.

## Deployment

The bot includes a simple Express server, making it ready for deployment on platforms like Heroku, Render, or Vercel.

## Contributing

Contributions are welcome! Feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the package.json file for details.
