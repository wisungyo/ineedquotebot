const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const { setTodayQuote, initScheduledQuotes } = require("./src/services/quoteService");
const { initializeCommands } = require("./src/commands/botCommands");
const { initializeServer } = require("./src/services/serverService");

const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(token, { polling: true });

initializeCommands(bot);
initScheduledQuotes(bot, chatId);
setTodayQuote();

initializeServer();
