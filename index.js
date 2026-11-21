const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const { setTodayQuote, initScheduledQuotes } = require("./src/services/quoteService");
const { initializeAdminCommands } = require("./src/commands/adminCommands");
const { initializeCommands } = require("./src/commands/botCommands");
const { initializeInlineMode } = require("./src/services/inlineService");
const { initializeServer } = require("./src/services/serverService");
const { commandMenus } = require("./src/constants/commands");

const token = process.env.TL_TOKEN;
const adminChatId = process.env.TL_ADMIN_CHAT_ID;

const bot = new TelegramBot(token, {
    polling: {
        params: {
            allowed_updates: JSON.stringify(["message", "callback_query", "inline_query", "chosen_inline_result", "my_chat_member"]),
        },
    },
});

initializeCommands(bot);
initializeAdminCommands(bot, adminChatId);
initializeInlineMode(bot);

initScheduledQuotes(bot, adminChatId);
setTodayQuote();

/**
 * Keep the command menus in Telegram in sync with the code
 */
async function registerCommandMenus() {
    try {
        await bot.setMyCommands(commandMenus.private, { scope: { type: "all_private_chats" } });
        await bot.setMyCommands(commandMenus.groups, { scope: { type: "all_group_chats" } });
        await bot.setMyCommands(commandMenus.private); // default scope
        if (adminChatId) {
            await bot.setMyCommands([...commandMenus.private, ...commandMenus.admin], {
                scope: { type: "chat", chat_id: adminChatId },
            });
        }
        console.log("✅ Command menus registered");
    } catch (error) {
        console.error("Failed to register command menus:", error.message);
    }
}
registerCommandMenus();

const app = initializeServer();

console.log("✅ Bot started successfully");
