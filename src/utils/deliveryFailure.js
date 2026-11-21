const { unsubscribe } = require("../services/dbService");
const { notifyAdminAutoUnsubscribe } = require("./adminNotify");

/**
 * Telegram errors that mean we can never deliver to this chat again
 * (user blocked the bot, deleted their account, kicked the bot, chat gone).
 */
const PERMANENT_FAILURES = [
    /bot was blocked by the user/i,
    /user is deactivated/i,
    /bot was kicked/i,
    /chat not found/i,
    /bot can't initiate conversation/i,
];

/**
 * @param {Error} error - Error thrown by node-telegram-bot-api
 * @returns {Boolean} whether the chat is permanently unreachable
 */
function isPermanentFailure(error) {
    const status = error && error.response && error.response.statusCode;
    const description = (error && error.response && error.response.body && error.response.body.description) || (error && error.message) || "";
    if (status && status !== 403 && status !== 400) return false;
    return PERMANENT_FAILURES.some((re) => re.test(description));
}

/**
 * Handle a failed delivery to a subscriber: log it and, if the chat is
 * permanently unreachable, unsubscribe it and tell the admin.
 * Never throws.
 * @param {Object} bot - Telegram bot instance
 * @param {String|Number} chatId
 * @param {Error} error
 * @returns {Promise<Boolean>} true if the subscriber was auto-unsubscribed
 */
async function handleDeliveryFailure(bot, chatId, error) {
    console.error(`Failed to send message to chat ID ${chatId}:`, error.message);
    if (!isPermanentFailure(error)) return false;
    try {
        const removed = await unsubscribe(chatId);
        if (removed) {
            console.log(`🚫 Auto-unsubscribed ${chatId}: ${error.message}`);
            await notifyAdminAutoUnsubscribe(bot, chatId, error.message);
        }
        return removed;
    } catch (e) {
        console.error(`Failed to auto-unsubscribe ${chatId}:`, e.message);
        return false;
    }
}

module.exports = {
    isPermanentFailure,
    handleDeliveryFailure,
};
