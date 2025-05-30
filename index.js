const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const { initializeCommands, initScheduledQuotes } = require("./src/commands/botCommands");
const { initializeServer } = require("./src/services/serverService");
const { setTodayQuote } = require("./src/services/quoteService");

const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(token, { polling: true });

initializeCommands(bot);
initScheduledQuotes(bot, chatId);
setTodayQuote();

initializeServer();
