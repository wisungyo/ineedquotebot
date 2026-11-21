const {
    isKnownCommand,
    commandRegex,
    start: startCommand,
    todayQuote,
    randomQuote,
    subscribe: subscribeCommand,
    unsubscribe: unsubscribeCommand,
} = require("../constants/commands");
const {
    commandInstructions,
    commandInstructionsAdmin,
    subscriptionTexts,
    welcomePrivate,
    welcomeGroup,
    startTips,
} = require("../constants/copytexts");
const {
    subscribe,
    unsubscribe,
    isSubscribed,
    migrateChatId,
    getOrCreateCard,
    setCardFileId,
} = require("../services/dbService");
const { getQuote, getTodayQuote, sendQuote, escapeHtml, quoteFromMessage } = require("../services/quoteService");
const { renderQuoteCard, styleForDate } = require("../services/cardService");
const { cardShareKeyboard, cardCaption } = require("../utils/share");
const { notifyAdminSubscription } = require("../utils/adminNotify");

const isGroup = (chat) => chat && (chat.type === "group" || chat.type === "supergroup");

/**
 * In groups only admins may change the subscription. Private chats always allowed.
 * @returns {Promise<Boolean>}
 */
async function canManageSubscription(bot, chat, user) {
    if (!isGroup(chat)) return true;
    if (!user) return false;
    // Anonymous group admins post as the group itself
    if (user.username === "GroupAnonymousBot") return true;
    try {
        const member = await bot.getChatMember(chat.id, user.id);
        return ["creator", "administrator"].includes(member.status);
    } catch (error) {
        console.error("Error checking group admin:", error.message);
        return false;
    }
}

/**
 * Subscribe the chat a message/button came from, replying in that chat.
 * @param {Object} bot
 * @param {Object} chat - Telegram chat
 * @param {Object} user - Telegram user who triggered it
 * @returns {Promise<'subscribed'|'already'|'forbidden'|'error'>}
 */
async function subscribeChat(bot, chat, user, { silent = false } = {}) {
    const group = isGroup(chat);
    if (!(await canManageSubscription(bot, chat, user))) {
        if (!silent) await bot.sendMessage(chat.id, subscriptionTexts.adminsOnly);
        return "forbidden";
    }
    if (await isSubscribed(chat.id)) {
        if (!silent) await bot.sendMessage(chat.id, group ? subscriptionTexts.alreadySubscribedGroup : subscriptionTexts.alreadySubscribed);
        return "already";
    }
    const result = await subscribe(user, chat.id, chat);
    if (!result) {
        if (!silent) await bot.sendMessage(chat.id, subscriptionTexts.error);
        return "error";
    }
    if (!silent) await bot.sendMessage(chat.id, group ? subscriptionTexts.subscribedGroup : subscriptionTexts.subscribed);
    notifyAdminSubscription(bot, "subscribe", { chat, from: user });
    return "subscribed";
}

/**
 * Initialize the bot with command handlers
 * @param {Object} bot - Telegram bot instance
 */
function initializeCommands(bot) {
    /**
     * @command : /start [payload]
     * @description : Onboarding. Greets the user, shows today's quote with a
     *                one-tap subscribe button. Payload (deep link) is logged as source.
     */
    bot.onText(commandRegex(startCommand), async (msg, match) => {
        const chat = msg.chat;
        try {
            const source = (match && match[1] && match[1].trim()) || "direct";
            console.log(`/start from ${msg.from && (msg.from.username || msg.from.id)} (source: ${source})`);

            const quote = await getTodayQuote();
            if (isGroup(chat)) {
                await bot.sendMessage(chat.id, welcomeGroup(escapeHtml(chat.title || "there")), { parse_mode: "HTML" });
                await sendQuote(bot, chat.id, quote, { kind: "today", subscribeButton: !(await isSubscribed(chat.id)) });
                return;
            }

            const subscribed = await isSubscribed(chat.id);
            const name = escapeHtml((msg.from && msg.from.first_name) || "there");
            await bot.sendMessage(chat.id, welcomePrivate(name, subscribed), { parse_mode: "HTML" });
            await sendQuote(bot, chat.id, quote, { kind: "today", subscribeButton: !subscribed });
            await bot.sendMessage(chat.id, startTips, { parse_mode: "HTML" });
        } catch (error) {
            console.error("Error handling /start:", error.message);
        }
    });

    /**
     * @command : /todayquote
     * @description : Get today's quote (same quote all day, refreshed daily)
     */
    bot.onText(commandRegex(todayQuote), async (msg) => {
        try {
            const quote = await getTodayQuote();
            await sendQuote(bot, msg.chat.id, quote, { kind: "today" });
        } catch (error) {
            console.error("Error fetching quote:", error);
        }
    });

    /**
     * @command : /randomquote
     * @description : Generate a random quote
     */
    bot.onText(commandRegex(randomQuote), async (msg) => {
        try {
            const quote = await getQuote("random");
            await sendQuote(bot, msg.chat.id, quote, { kind: "random" });
        } catch (error) {
            console.error("Error fetching quote:", error);
        }
    });

    /**
     * @buttons : inline buttons under quote messages
     *   quote:random -> 🎲 Another one
     *   quote:card   -> 🖼 Image (quote card PNG)
     *   sub:daily    -> ☀️ Send me one every morning
     */
    bot.on("callback_query", async (query) => {
        const chat = query.message && query.message.chat;
        if (!chat) return bot.answerCallbackQuery(query.id).catch(() => {});
        try {
            if (query.data === "quote:random") {
                await bot.answerCallbackQuery(query.id);
                const quote = await getQuote("random");
                await sendQuote(bot, chat.id, quote, { kind: "random" });
                return;
            }

            if (query.data === "quote:card") {
                const quote = quoteFromMessage(query.message.text || query.message.caption || "");
                if (!quote) {
                    await bot.answerCallbackQuery(query.id, { text: "Couldn't read this quote 😕" });
                    return;
                }
                await bot.answerCallbackQuery(query.id, { text: "🖼 Making your image…" });
                bot.sendChatAction(chat.id, "upload_photo").catch(() => {});

                const style = styleForDate();
                const card = await getOrCreateCard(quote, style);
                const options = {
                    caption: cardCaption,
                    reply_markup: card ? cardShareKeyboard(quote, card.id) : undefined,
                };
                // Reuse the already-uploaded image when we have it
                const photo = card && card.file_id ? card.file_id : renderQuoteCard(quote, style);
                const sent = await bot.sendPhoto(chat.id, photo, options, { filename: "quote.png", contentType: "image/png" });
                if (card && !card.file_id && sent.photo && sent.photo.length) {
                    await setCardFileId(card.id, sent.photo[sent.photo.length - 1].file_id);
                }
                return;
            }

            if (query.data === "sub:daily") {
                const status = await subscribeChat(bot, chat, query.from, { silent: true });
                const toast = {
                    subscribed: isGroup(chat) ? "🎉 This group gets a quote every morning!" : "🎉 Subscribed! See you tomorrow at 6 AM",
                    already: "You're already subscribed 😊",
                    forbidden: "Only group admins can do this 🙏🏼",
                    error: "❌ Something went wrong, try /subscribe",
                }[status];
                await bot.answerCallbackQuery(query.id, { text: toast, show_alert: status === "forbidden" });

                if (status === "subscribed" || status === "already") {
                    // Drop the subscribe row from the keyboard, keep Another one / Share
                    const keyboard = (query.message.reply_markup && query.message.reply_markup.inline_keyboard) || [];
                    const kept = keyboard.filter((row) => !row.some((b) => b.callback_data === "sub:daily"));
                    await bot
                        .editMessageReplyMarkup({ inline_keyboard: kept }, { chat_id: chat.id, message_id: query.message.message_id })
                        .catch(() => {});
                }
                if (status === "subscribed") {
                    await bot.sendMessage(chat.id, isGroup(chat) ? subscriptionTexts.subscribedGroup : subscriptionTexts.subscribed);
                }
                return;
            }

            await bot.answerCallbackQuery(query.id);
        } catch (error) {
            console.error("Error handling button:", error.message);
            bot.answerCallbackQuery(query.id).catch(() => {});
        }
    });

    /**
     * @command : /subscribe
     * @description : Subscribe this chat (private or group) to daily quotes
     */
    bot.onText(commandRegex(subscribeCommand), async (msg) => {
        try {
            await subscribeChat(bot, msg.chat, msg.from);
        } catch (error) {
            console.error("Error subscribing:", error);
            bot.sendMessage(msg.chat.id, subscriptionTexts.error);
        }
    });

    /**
     * @command : /unsubscribe
     * @description : Unsubscribe this chat from daily quotes
     */
    bot.onText(commandRegex(unsubscribeCommand), async (msg) => {
        const chat = msg.chat;
        const group = isGroup(chat);
        try {
            if (!(await canManageSubscription(bot, chat, msg.from))) {
                bot.sendMessage(chat.id, subscriptionTexts.adminsOnly);
                return;
            }
            if (!(await isSubscribed(chat.id))) {
                bot.sendMessage(chat.id, group ? subscriptionTexts.notSubscribedGroup : subscriptionTexts.notSubscribed);
                return;
            }
            const result = await unsubscribe(chat.id);
            if (result) {
                bot.sendMessage(chat.id, group ? subscriptionTexts.unsubscribedGroup : subscriptionTexts.unsubscribed);
                notifyAdminSubscription(bot, "unsubscribe", msg);
            } else {
                bot.sendMessage(chat.id, subscriptionTexts.error);
            }
        } catch (error) {
            console.error("Error unsubscribing:", error);
            bot.sendMessage(chat.id, subscriptionTexts.error);
        }
    });

    /**
     * @event : bot added to / removed from a group
     */
    bot.on("my_chat_member", async (update) => {
        const chat = update.chat;
        if (!isGroup(chat)) return;
        const before = update.old_chat_member && update.old_chat_member.status;
        const after = update.new_chat_member && update.new_chat_member.status;
        const wasIn = ["member", "administrator", "creator", "restricted"].includes(before);
        const isIn = ["member", "administrator", "creator", "restricted"].includes(after);
        try {
            if (!wasIn && isIn) {
                console.log(`➕ Added to group ${chat.title} (${chat.id})`);
                const quote = await getTodayQuote();
                await bot.sendMessage(chat.id, welcomeGroup(escapeHtml(chat.title || "there")), { parse_mode: "HTML" });
                await sendQuote(bot, chat.id, quote, { kind: "today", subscribeButton: true });
            } else if (wasIn && !isIn) {
                console.log(`➖ Removed from group ${chat.title} (${chat.id})`);
                if (await unsubscribe(chat.id)) {
                    notifyAdminSubscription(bot, "unsubscribe", { chat, from: update.from });
                }
            }
        } catch (error) {
            console.error("Error handling group membership change:", error.message);
        }
    });

    /**
     * @description : Handle incoming messages
     */
    bot.on("message", (msg) => {
        // Group upgraded to supergroup: keep its subscription
        if (msg.migrate_to_chat_id) {
            migrateChatId(msg.chat.id, msg.migrate_to_chat_id);
            return;
        }
        if (!msg.text) return;
        console.log("Message received on", new Date().toISOString(), "from", (msg.from && (msg.from.username || msg.from.id)) || "?");
        // Ignore messages that are actually available commands
        if (isKnownCommand(msg.text)) return;
        // In groups, stay quiet unless spoken to directly
        if (isGroup(msg.chat)) return;
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
