const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const { setTodayQuote, initScheduledQuotes } = require("./src/services/quoteService");
const { initializeAdminCommands } = require("./src/commands/adminCommands");
const { initializeCommands } = require("./src/commands/botCommands");
const { initializeServer } = require("./src/services/serverService");

const token = process.env.TL_TOKEN;
const adminChatId = process.env.TL_ADMIN_CHAT_ID;

const bot = new TelegramBot(token, { polling: true });

initializeCommands(bot);
initializeAdminCommands(bot, adminChatId);

initScheduledQuotes(bot, adminChatId);
setTodayQuote();

const app = initializeServer();

console.log("✅ Bot started successfully");
