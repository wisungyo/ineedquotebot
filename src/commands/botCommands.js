const {
    generalCommands,
    adminCommands,
    todayQuote,
    randomQuote,
    subscribe: subscribeCommand,
    unsubscribe: unsubscribeCommand,
} = require("../constants/commands");
const { commandInstructions, commandInstructionsAdmin, subscriptionTexts } = require("../constants/copytexts");
const { subscribe, unsubscribe, isSubscribed } = require("../services/dbService");
const { getQuote, getTodayQuote } = require("../services/quoteService");

/**
 * Initialize the bot with command handlers
 * @param {Object} bot - Telegram bot instance
 * @param {String} chatId - Default chat ID for broadcasting
 */
function initializeCommands(bot) {
    /**
     * @command : /todayquote
     * @description : Get today's quote
     * @note : This command will return the same quote until the next day
     *         unless the bot is restarted or the quote is manually updated.
     *         It is designed to provide a consistent quote for the day.
     */
    bot.onText(new RegExp(`/${todayQuote}`), async (msg) => {
        try {
            let todayQuote = await getTodayQuote();
            bot.sendMessage(msg.chat.id, todayQuote);
        } catch (error) {
            console.error("Error fetching quote:", error);
        }
    });

    /**
     * @command : /randomquote
     * @description : Generate a random quote
     */
    bot.onText(new RegExp(`/${randomQuote}`), async (msg) => {
        try {
            const quote = await getQuote("random");
            bot.sendMessage(msg.chat.id, quote);
        } catch (error) {
            console.error("Error fetching quote:", error);
        }
    });

    /**
     * @command : /subscribe
     * @description : Subscribe to daily quotes
     */
    bot.onText(new RegExp(`/${subscribeCommand}`), async (msg) => {
        try {
            const chatId = msg.chat.id;

            const isAlreadySubscribed = await isSubscribed(chatId);
            if (isAlreadySubscribed) {
                bot.sendMessage(chatId, subscriptionTexts.alreadySubscribed);
                return;
            }

            const result = await subscribe(msg.from, chatId);
            if (result) {
                bot.sendMessage(chatId, subscriptionTexts.subscribed);
            } else {
                bot.sendMessage(chatId, subscriptionTexts.error);
            }
        } catch (error) {
            console.error("Error subscribing:", error);
            bot.sendMessage(msg.chat.id, subscriptionTexts.error);
        }
    });

    /**
     * @command : /unsubscribe
     * @description : Unsubscribe from daily quotes
     */
    bot.onText(new RegExp(`/${unsubscribeCommand}`), async (msg) => {
        try {
            const chatId = msg.chat.id;

            const isUserSubscribed = await isSubscribed(chatId);
            if (!isUserSubscribed) {
                bot.sendMessage(chatId, subscriptionTexts.notSubscribed);
                return;
            }

            const result = await unsubscribe(chatId);
            if (result) {
                bot.sendMessage(chatId, subscriptionTexts.unsubscribed);
            } else {
                bot.sendMessage(chatId, subscriptionTexts.error);
            }
        } catch (error) {
            console.error("Error unsubscribing:", error);
            bot.sendMessage(msg.chat.id, subscriptionTexts.error);
        }
    });

    /**
     * @description : Handle incoming messages
     */
    bot.on("message", (msg) => {
        const date = new Date();
        console.log("Message received on", date.toISOString(), "from", msg.from.username || msg.from.id);
        // Ignore messages that are actually available commands
        if (generalCommands.includes(msg.text) || adminCommands.includes(msg.text)) return;
        if (msg.chat.id == process.env.TL_ADMIN_CHAT_ID) {
            bot.sendMessage(msg.chat.id, commandInstructionsAdmin);
        } else {
            bot.sendMessage(msg.chat.id, commandInstructions);
        }
    });
}

module.exports = {
    initializeCommands,
};
