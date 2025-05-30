const { getQuote, getTodayQuote, setTodayQuote } = require("../services/quoteService");
const { commandInstructions } = require("../../constant");

/**
 * Initialize the bot with command handlers
 * @param {Object} bot - Telegram bot instance
 * @param {String} chatId - Default chat ID for broadcasting
 */
function initializeCommands(bot) {
    const availableCommands = ["/todayquote", "/randomquote"];

    /**
     * @command : /todayquote
     * @description : Get today's quote
     * @note : This command will return the same quote until the next day
     *         unless the bot is restarted or the quote is manually updated.
     *         It is designed to provide a consistent quote for the day.
     */
    bot.onText(/\/todayquote/, async (msg) => {
        try {
            let todayQuote = getTodayQuote();
            if (!todayQuote) todayQuote = await setTodayQuote();
            bot.sendMessage(msg.chat.id, todayQuote);
        } catch (error) {
            console.error("Error fetching quote:", error);
        }
    });

    /**
     * @command : /randomquote
     * @description : Generate a random quote
     */
    bot.onText(/\/randomquote/, async (msg) => {
        try {
            const quote = await getQuote("random");
            bot.sendMessage(msg.chat.id, quote);
        } catch (error) {
            console.error("Error fetching quote:", error);
        }
    });

    /**
     * @description : Handle incoming messages
     */
    bot.on("message", (msg) => {
        const date = new Date();
        console.log("Message received on", date.toISOString(), "from", msg.from.username || msg.from.id);
        // Ignore messages that are actually available commands
        if (availableCommands.includes(msg.text)) return;
        bot.sendMessage(msg.chat.id, commandInstructions);
    });
}

/**
 * Initialize scheduled quote sending
 * @param {Object} bot - Telegram bot instance
 * @param {String} chatId - Default chat ID for broadcasting
 */
function initScheduledQuotes(bot, chatId) {
    const cron = require("node-cron");

    // @cron : every day at 6 am
    cron.schedule("0 6 * * *", async () => {
        try {
            const quote = await getQuote();
            todayQuote = quote;
            // TODO : this will only send to my chat room. need to work on this to broadcast to all users
            bot.sendMessage(chatId, quote);
        } catch (error) {
            console.error("Error in cron job:", error);
        }
    });
}

module.exports = {
    initializeCommands,
    initScheduledQuotes,
};
