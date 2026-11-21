const { getAllSubscribers } = require("../services/dbService");

/**
 * Escape text for Telegram HTML parse mode
 * @param {String} text
 */
function escapeHtml(text = "") {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Notify the admin when someone subscribes or unsubscribes.
 * Never throws: a failed notification must not break the user's command.
 * @param {Object} bot - Telegram bot instance
 * @param {'subscribe'|'unsubscribe'} event
 * @param {Object} msg - Incoming Telegram message
 */
async function notifyAdminSubscription(bot, event, msg) {
    const adminChatId = process.env.TL_ADMIN_CHAT_ID;
    if (!adminChatId) return;

    try {
        const user = msg.from || {};
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Unknown";
        const username = user.username ? `@${escapeHtml(user.username)}` : "<i>no username</i>";
        const subscribers = await getAllSubscribers();
        const chat = msg.chat || {};
        const isGroupChat = chat.type === "group" || chat.type === "supergroup";
        const header =
            event === "subscribe"
                ? isGroupChat
                    ? "🟢 <b>New group subscriber</b>"
                    : "🟢 <b>New subscriber</b>"
                : isGroupChat
                ? "🔴 <b>Group unsubscribed</b>"
                : "🔴 <b>Unsubscribed</b>";
        const time = new Date().toLocaleString("en-GB", {
            timeZone: "Asia/Jakarta",
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        const text =
            `${header}\n\n` +
            (isGroupChat ? `👥 ${escapeHtml(chat.title || "Untitled group")}\n` : "") +
            `👤 ${escapeHtml(fullName)} (${username})\n` +
            `🆔 <code>${msg.chat.id}</code>\n` +
            `🕒 ${time} WIB\n\n` +
            `📊 Active subscribers: <b>${subscribers.length}</b>`;

        await bot.sendMessage(adminChatId, text, { parse_mode: "HTML" });
    } catch (error) {
        console.error(`Failed to notify admin about ${event}:`, error.message);
    }
}

/**
 * Notify the admin that a subscriber was removed automatically because
 * Telegram reported the chat as unreachable (blocked / deleted account).
 * Never throws.
 * @param {Object} bot - Telegram bot instance
 * @param {String|Number} chatId
 * @param {String} reason - Telegram error message
 */
async function notifyAdminAutoUnsubscribe(bot, chatId, reason) {
    const adminChatId = process.env.TL_ADMIN_CHAT_ID;
    if (!adminChatId) return;
    try {
        const subscribers = await getAllSubscribers();
        const text =
            `🚫 <b>Auto-unsubscribed</b>\n\n` +
            `🆔 <code>${chatId}</code>\n` +
            `❗ ${escapeHtml(reason.replace(/^ETELEGRAM:\s*/, ""))}\n\n` +
            `📊 Active subscribers: <b>${subscribers.length}</b>`;
        await bot.sendMessage(adminChatId, text, { parse_mode: "HTML" });
    } catch (error) {
        console.error("Failed to notify admin about auto-unsubscribe:", error.message);
    }
}

module.exports = {
    notifyAdminSubscription,
    notifyAdminAutoUnsubscribe,
};
