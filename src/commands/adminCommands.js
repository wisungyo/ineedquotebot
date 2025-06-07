const { stats, broadcast, adminCommands } = require("../constants/commands");
const { broadcastToSubscribers } = require("../utils/broadcast");
const { getAllSubscribers } = require("../services/dbService");

/**
 * Initialize admin commands for the bot
 * @param {Object} bot - Telegram bot instance
 * @param {String} adminChatId - Chat ID of the admin user
 */
function initializeAdminCommands(bot, adminChatId) {
    if (!adminChatId) {
        console.warn("Admin chat ID not provided. Admin commands will not work.");
        return;
    }

    /**
     * @command : /stats
     * @description : Get subscriber statistics
     * @admin : Only accessible by admin
     */
    bot.onText(new RegExp(`^${stats}$`), async (msg) => {
        if (msg.chat.id.toString() !== adminChatId.toString()) {
            return;
        }

        try {
            const subscribers = await getAllSubscribers();
            const stats = {
                totalSubscribers: subscribers ? subscribers.length : 0,
                date: new Date().toISOString(),
            };

            const message =
                `📊 Bot Statistics\n\n` +
                `Total subscribers: ${stats.totalSubscribers}\n` +
                `Date: ${new Date(stats.date).toLocaleString()}`;

            bot.sendMessage(msg.chat.id, message);
        } catch (error) {
            console.error("Error getting stats:", error);
            bot.sendMessage(msg.chat.id, "❌ Error fetching statistics.");
        }
    });

    /**
     * @command : /broadcast
     * @description : Broadcast a message to all subscribers
     * @admin : Only accessible by admin
     * @usage : /broadcast Your message here
     */
    bot.onText(new RegExp(`^${broadcast} (.+)$`), async (msg, match) => {
        if (msg.chat.id.toString() !== adminChatId.toString()) {
            return;
        }

        const broadcastMessage = match[1];

        try {
            bot.sendMessage(msg.chat.id, "🔄 Broadcasting message to all subscribers...");

            const result = await broadcastToSubscribers(bot, broadcastMessage);

            let responseMessage = "";
            if (result.success) {
                responseMessage =
                    `✅ Broadcast complete!\n\n` +
                    `Total subscribers: ${result.totalSubscribers}\n` +
                    `Successfully sent: ${result.sentCount}\n` +
                    `Failed: ${result.failedCount}`;
            } else {
                responseMessage = `❌ Broadcast failed: ${result.message}`;
            }

            bot.sendMessage(msg.chat.id, responseMessage);
        } catch (error) {
            console.error("Error broadcasting:", error);
            bot.sendMessage(msg.chat.id, "❌ Error during broadcast operation.");
        }
    });

    /**
     * @command : /broadcast
     * @description : Handle case when /broadcast is sent without a message
     */
    bot.onText(new RegExp(`^${broadcast}$`), (msg) => {
        if (msg.chat.id.toString() !== adminChatId.toString()) {
            return;
        }
        bot.sendMessage(msg.chat.id, "❌ Please provide a message to broadcast. Usage: /broadcast Your message here");
    });
}

module.exports = {
    initializeAdminCommands,
    adminCommands,
};
