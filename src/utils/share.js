/**
 * Sharing quote cards.
 *
 * Telegram bots can't hand an image to another app (Instagram, WhatsApp, X…)
 * directly, so sharing works in two ways:
 *  1. Inside Telegram: "Send to a chat" opens the chat picker (switch_inline_query)
 *     and posts the actual image card via inline mode (cached by file_id).
 *  2. Other apps: link buttons that open the app's own share screen with the
 *     quote text + bot link prefilled. For posting the image itself (IG story,
 *     WA status) users save the photo from Telegram and upload it.
 */
const { BOT_USERNAME } = require("../constants/commands");

const BOT_LINK = `https://t.me/${BOT_USERNAME}`;
const enc = encodeURIComponent;

/**
 * Text used when sharing a quote outside Telegram
 * @param {Object} quote - { text, author }
 */
function shareText(quote) {
    return `“${quote.text}” — ${quote.author}\n\nGet a fresh quote every morning 👉 ${BOT_LINK}`;
}

/**
 * Inline keyboard under a quote card photo
 * @param {Object} quote - { text, author }
 * @param {Number} cardId - quote_cards.id
 */
function cardShareKeyboard(quote, cardId) {
    const text = shareText(quote);
    const shortText = `“${quote.text}” — ${quote.author}`;
    return {
        inline_keyboard: [
            [{ text: "📤 Send image to a chat", switch_inline_query: `card_${cardId}` }],
            [
                { text: "WhatsApp", url: `https://wa.me/?text=${enc(text)}` },
                { text: "X / Twitter", url: `https://x.com/intent/post?text=${enc(shortText)}&url=${enc(BOT_LINK)}` },
            ],
            [
                { text: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${enc(BOT_LINK)}` },
                { text: "Threads", url: `https://www.threads.net/intent/post?text=${enc(text)}` },
                { text: "LinkedIn", url: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(BOT_LINK)}` },
            ],
            [{ text: "🎲 Another one", callback_data: "quote:random" }],
        ],
    };
}

const cardCaption =
    `✨ Your quote card is ready!\n\n` +
    `📲 Instagram / WA Status: tap the image → ⋮ → Save to gallery, then post it.\n` +
    `👇 Or share it right away:`;

module.exports = {
    shareText,
    cardShareKeyboard,
    cardCaption,
};
