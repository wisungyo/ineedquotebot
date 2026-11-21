const fs = require("fs");
const path = require("path");
const { getTodayQuote, formatQuoteBody, quoteKeyboard } = require("./quoteService");
const { BOT_USERNAME } = require("../constants/commands");

const MAX_RESULTS = 20;
let localQuotes = null;

/**
 * Lazily load and cache the local quotes (≈5k entries)
 * @returns {Array<{text: String, author: String}>}
 */
function getLocalQuotes() {
    if (!localQuotes) {
        const raw = JSON.parse(fs.readFileSync(path.join(__dirname, "../constants/quotes.json")));
        const seen = new Set();
        localQuotes = [];
        for (const q of raw) {
            if (!q.quoteText || seen.has(q.quoteText)) continue;
            seen.add(q.quoteText);
            localQuotes.push({ text: q.quoteText.trim(), author: (q.quoteAuthor || "Unknown").trim() });
        }
    }
    return localQuotes;
}

/**
 * Pick n random items from an array (no repeats)
 */
function sample(array, n) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
}

/**
 * Find quotes for an inline query: search by text or author, or random picks
 * @param {String} query
 * @returns {Array<{text, author}>}
 */
function findQuotes(query) {
    const all = getLocalQuotes();
    const q = (query || "").trim().toLowerCase();
    if (!q) return sample(all, MAX_RESULTS);
    const words = q.split(/\s+/);
    const matches = all.filter((item) => {
        const hay = `${item.text} ${item.author}`.toLowerCase();
        return words.every((w) => hay.includes(w));
    });
    return sample(matches, MAX_RESULTS);
}

function truncate(text, max) {
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Build an InlineQueryResultArticle for a quote
 */
function toArticle(quote, id, title) {
    return {
        type: "article",
        id: String(id).slice(0, 64),
        title: title || truncate(`“${quote.text}”`, 100),
        description: title ? truncate(`“${quote.text}” — ${quote.author}`, 120) : `— ${quote.author}`,
        input_message_content: {
            message_text: formatQuoteBody(quote),
            parse_mode: "HTML",
            disable_web_page_preview: true,
        },
        reply_markup: {
            inline_keyboard: [[{ text: "☀️ Get a quote every morning", url: `https://t.me/${BOT_USERNAME}?start=inline` }]],
        },
    };
}

/**
 * Register the inline-mode handler (@ineedquotebot <search> in any chat)
 * Inline mode must be enabled in @BotFather (/setinline).
 * @param {Object} bot - Telegram bot instance
 */
function initializeInlineMode(bot) {
    bot.on("inline_query", async (inlineQuery) => {
        try {
            const query = inlineQuery.query || "";
            const results = [];

            if (!query.trim()) {
                const today = await getTodayQuote();
                if (today) results.push(toArticle(today, `today-${today.dateKey}`, "💭 Quote of the day"));
            }

            findQuotes(query).forEach((quote, i) => {
                results.push(toArticle(quote, `q-${i}-${Buffer.from(quote.text).toString("base64").slice(0, 40)}`));
            });

            await bot.answerInlineQuery(inlineQuery.id, results.slice(0, 50), {
                cache_time: query.trim() ? 300 : 10,
                is_personal: false,
                button: results.length
                    ? undefined
                    : JSON.stringify({ text: "No quotes found. Open I Need Quote", start_parameter: "inline" }),
            });
        } catch (error) {
            console.error("Error answering inline query:", error.message);
        }
    });

    bot.on("chosen_inline_result", () => {});
}

module.exports = {
    initializeInlineMode,
    findQuotes,
    // exported for tests
    _quoteKeyboard: quoteKeyboard,
};
