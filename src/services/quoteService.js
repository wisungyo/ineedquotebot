const { getActiveSubscribers, getDailyQuote, saveDailyQuote, getRecentDailyQuoteTexts } = require("./dbService");
const { handleDeliveryFailure } = require("../utils/deliveryFailure");
const quotesFilePath = "./src/constants/quotes.json";
const axios = require("axios");
const cron = require("node-cron");
const fs = require("fs");

const TIMEZONE = "Asia/Jakarta";
const BOT_USERNAME = process.env.TL_BOT_USERNAME || "ineedquotebot";

/**
 * @var {Object|null} cached quote of the day: { text, author, source, dateKey }
 */
let todayQuote = null;

/**
 * Current date in Asia/Jakarta
 * @returns {{ key: String, label: String }} key = YYYY-MM-DD, label = "Saturday, 21 November 2026"
 */
function jakartaDate() {
    const now = new Date();
    const key = now.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
    const label = now.toLocaleDateString("en-GB", {
        timeZone: TIMEZONE,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    return { key, label };
}

/**
 * Escape text for Telegram HTML parse mode
 * @param {String} text
 */
function escapeHtml(text = "") {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Get a quote based on type (today or random)
 * @param {String} type - 'today' or 'random'
 * @returns {Promise<Object>} { text, author, source: 'zenquotes'|'local', dateKey }
 */
async function getQuote(type = "today") {
    const { key } = jakartaDate();
    try {
        const response = await axios.get(`${process.env.ZENQUOTES_API_URL}/${type}`, { timeout: 8000 });
        const quoteData = response.data[0];
        if (!quoteData || !quoteData.q || /too many requests/i.test(quoteData.q)) {
            throw new Error("ZenQuotes returned no usable quote");
        }
        return { text: quoteData.q, author: quoteData.a, source: "zenquotes", dateKey: key };
    } catch (error) {
        console.error("Failed to fetch quote:", error.message);
        // Fallback to local quotes if API fails
        const quotesData = JSON.parse(fs.readFileSync(quotesFilePath));
        const pick = quotesData[Math.floor(Math.random() * quotesData.length)];
        return { text: pick.quoteText, author: pick.quoteAuthor || "Unknown", source: "local", dateKey: key };
    }
}

/**
 * Render a quote as a Telegram HTML message
 * @param {Object} quote - from getQuote()
 * @param {Object} options
 * @param {'daily'|'today'|'random'} options.kind - which header to show
 * @param {String} [options.name] - subscriber first name for the morning greeting
 * @returns {String} HTML text
 */
function formatQuote(quote, { kind = "today", name } = {}) {
    const { label } = jakartaDate();
    let header;
    if (kind === "daily") {
        header = name ? `☀️ Good morning, <b>${escapeHtml(name)}</b>!\nHere's your quote for today:` : `☀️ Good morning!\nHere's your quote for today:`;
    } else if (kind === "random") {
        header = "🎲 <b>Random quote</b>";
    } else {
        header = "💭 <b>Quote of the day</b>";
    }

    const lines = [
        header,
        "",
        `<blockquote>“${escapeHtml(quote.text)}”\n\n— <b>${escapeHtml(quote.author)}</b></blockquote>`,
        "",
        `<i>📅 ${label}</i>`,
    ];
    return lines.join("\n");
}

/**
 * Inline keyboard shown under every quote
 * @param {Object} quote - from getQuote()
 */
function quoteKeyboard(quote, { subscribeButton = false } = {}) {
    const shareText = `“${quote.text}” — ${quote.author}\n\nGet a daily quote from @${BOT_USERNAME}`;
    const shareUrl =
        `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${BOT_USERNAME}`)}` +
        `&text=${encodeURIComponent(shareText)}`;
    const rows = [
        [
            { text: "🎲 Another one", callback_data: "quote:random" },
            { text: "🖼 Image", callback_data: "quote:card" },
            { text: "📤 Share", url: shareUrl },
        ],
    ];
    if (subscribeButton) {
        rows.push([{ text: "☀️ Send me one every morning", callback_data: "sub:daily" }]);
    }
    return { inline_keyboard: rows };
}

/**
 * Recover { text, author } from a quote message we sent earlier
 * (the rendered text contains “quote” followed by "— author").
 * @param {String} messageText - plain text of the Telegram message
 * @returns {Object|null}
 */
function quoteFromMessage(messageText = "") {
    const m = messageText.match(/“([\s\S]+)”\s*\n+\s*— ([^\n]+)/);
    return m ? { text: m[1].trim(), author: m[2].trim() } : null;
}

/**
 * Compact quote body used for inline-mode results (no header/date)
 * @param {Object} quote - { text, author }
 * @returns {String} HTML
 */
function formatQuoteBody(quote) {
    return `<blockquote>“${escapeHtml(quote.text)}”\n\n— <b>${escapeHtml(quote.author)}</b></blockquote>`;
}

/**
 * Send a quote message (HTML + buttons)
 * @param {Object} bot - Telegram bot instance
 * @param {String|Number} chatId
 * @param {Object} quote - from getQuote()
 * @param {Object} formatOptions - passed to formatQuote()
 */
function sendQuote(bot, chatId, quote, formatOptions = {}) {
    return bot.sendMessage(chatId, formatQuote(quote, formatOptions), {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: quoteKeyboard(quote, { subscribeButton: !!formatOptions.subscribeButton }),
    });
}

/**
 * Initialize scheduled quote sending
 * @param {Object} bot - Telegram bot instance
 */
function initScheduledQuotes(bot) {
    cron.schedule(
        process.env.CRON_DAILY_QUOTE,
        async () => {
            try {
                const quote = await getTodayQuote();

                const subscribers = await getActiveSubscribers();
                if (subscribers.length > 0) {
                    console.log(`Broadcasting quote to ${subscribers.length} subscribers`);
                    for (const subscriber of subscribers) {
                        try {
                            await sendQuote(bot, subscriber.chat_id, quote, {
                                kind: "daily",
                                name:
                                    subscriber.chat_type === "private"
                                        ? subscriber.first_name || subscriber.username
                                        : subscriber.chat_title,
                            });
                        } catch (sendError) {
                            await handleDeliveryFailure(bot, subscriber.chat_id, sendError);
                        }
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }
                }
            } catch (error) {
                console.error("Error in cron job:", error);
            }
        },
        {
            scheduled: true,
            timezone: TIMEZONE,
        }
    );
}

/** How many past days a quote of the day must not repeat from */
const NO_REPEAT_DAYS = 30;

const normalize = (text = "") => String(text).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Pick a local quote whose text is not in the excluded set
 * @param {Set<String>} excluded - normalized texts
 * @param {String} dateKey
 */
function pickLocalQuote(excluded, dateKey) {
    const quotesData = JSON.parse(fs.readFileSync(quotesFilePath));
    for (let i = 0; i < 50; i++) {
        const pick = quotesData[Math.floor(Math.random() * quotesData.length)];
        if (pick && pick.quoteText && !excluded.has(normalize(pick.quoteText))) {
            return { text: pick.quoteText, author: pick.quoteAuthor || "Unknown", source: "local", dateKey };
        }
    }
    const pick = quotesData.find((q) => q.quoteText && !excluded.has(normalize(q.quoteText))) || quotesData[0];
    return { text: pick.quoteText, author: pick.quoteAuthor || "Unknown", source: "local", dateKey };
}

/**
 * Decide the quote of the day for a date: reuse the stored one, otherwise pick a quote
 * that wasn't used in the last NO_REPEAT_DAYS days and store it.
 * @param {String} dateKey - YYYY-MM-DD (Asia/Jakarta)
 */
async function resolveDailyQuote(dateKey) {
    const stored = await getDailyQuote(dateKey);
    if (stored) return stored;

    const excluded = new Set((await getRecentDailyQuoteTexts(dateKey, NO_REPEAT_DAYS)).map(normalize));
    let quote = await getQuote("today");
    if (excluded.has(normalize(quote.text))) {
        console.log(`Quote of the day repeats a recent one ("${quote.text.slice(0, 40)}..."), picking another`);
        quote = pickLocalQuote(excluded, dateKey);
    }
    quote.dateKey = dateKey;
    return saveDailyQuote(quote);
}

/** in-flight refresh, so concurrent requests share one pick */
let pendingToday = null;

async function setTodayQuote() {
    const { key } = jakartaDate();
    if (pendingToday && pendingToday.key === key) return pendingToday.promise;
    const promise = (async () => {
        try {
            todayQuote = await resolveDailyQuote(key);
        } catch (error) {
            // DB unavailable: still serve something, avoiding at least yesterday's in-memory quote
            console.error("Error setting today's quote:", error.message);
            const excluded = new Set(todayQuote ? [normalize(todayQuote.text)] : []);
            let quote = await getQuote("today");
            if (excluded.has(normalize(quote.text))) quote = pickLocalQuote(excluded, key);
            todayQuote = { ...quote, dateKey: key };
        } finally {
            pendingToday = null;
        }
        return todayQuote;
    })();
    pendingToday = { key, promise };
    return promise;
}

/**
 * Get the quote of the day, refreshing it when the date changes
 * @returns {Promise<Object>}
 */
async function getTodayQuote() {
    if (!todayQuote || todayQuote.dateKey !== jakartaDate().key) {
        await setTodayQuote();
    }
    return todayQuote;
}

module.exports = {
    getQuote,
    setTodayQuote,
    getTodayQuote,
    initScheduledQuotes,
    formatQuote,
    formatQuoteBody,
    quoteFromMessage,
    sendQuote,
    quoteKeyboard,
    escapeHtml,
};
