const { getAllSubscribers } = require("../services/dbService");

/**
 * Broadcast a message to all subscribers
 * @param {Object} bot - Telegram bot instance
 * @param {String} message - Message to broadcast
 * @returns {Promise<Object>} - Result of the broadcast operation
 */
async function broadcastToSubscribers(bot, message) {
    try {
        const subscribers = await getAllSubscribers();

        if (!subscribers || subscribers.length === 0) {
            return {
                success: false,
                message: "No subscribers found",
                sentCount: 0,
                totalSubscribers: 0,
            };
        }

        console.log(`Broadcasting message to ${subscribers.length} subscribers...`);

        let sentCount = 0;
        let failedCount = 0;
        const failedChats = [];

        for (const chatId of subscribers) {
            try {
                await bot.sendMessage(chatId, message);
                sentCount++;
            } catch (error) {
                console.error(`Failed to send message to chat ID ${chatId}:`, error.message);
                failedCount++;
                failedChats.push({
                    chatId,
                    error: error.message,
                });
            }
        }

        return {
            success: true,
            message: `Broadcast complete. Sent to ${sentCount} subscribers. Failed: ${failedCount}`,
            sentCount,
            failedCount,
            totalSubscribers: subscribers.length,
            failedChats,
        };
    } catch (error) {
        console.error("Error broadcasting message:", error);
        return {
            success: false,
            message: `Error broadcasting: ${error.message}`,
            sentCount: 0,
            totalSubscribers: 0,
        };
    }
}

module.exports = {
    broadcastToSubscribers,
};
