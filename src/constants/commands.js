const BOT_USERNAME = process.env.TL_BOT_USERNAME || "ineedquotebot";

const start = "/start";
const todayQuote = "/todayquote";
const randomQuote = "/randomquote";
const subscribe = "/subscribe";
const unsubscribe = "/unsubscribe";

const stats = "/stats";
const broadcast = "/broadcast";

const generalCommands = [start, todayQuote, randomQuote, subscribe, unsubscribe];
const adminCommands = [stats, broadcast];

/**
 * Regex for a command at the start of a message, optionally addressed to this
 * bot (/todayquote@ineedquotebot). Captures an optional argument/payload.
 * Commands addressed to another bot (/todayquote@otherbot) don't match.
 * @param {String} command - e.g. "/todayquote"
 * @returns {RegExp}
 */
const commandRegex = (command) => new RegExp(`^${command}(?:@${BOT_USERNAME})?(?:\\s+([\\s\\S]*))?$`, "i");

/**
 * Check whether a message starts with a known command (e.g. "/broadcast hello")
 * @param {String} text - Incoming message text
 * @returns {Boolean}
 */
const isKnownCommand = (text = "") => {
    const command = text.trim().split(/\s/)[0].split("@")[0].toLowerCase();
    return generalCommands.includes(command) || adminCommands.includes(command);
};

/**
 * Command menus registered with Telegram (setMyCommands) on startup
 */
const commandMenus = {
    private: [
        { command: "todayquote", description: "Get today's quote" },
        { command: "randomquote", description: "Get a random quote" },
        { command: "subscribe", description: "Get a quote every morning at 6 AM (WIB)" },
        { command: "unsubscribe", description: "Stop the daily quote" },
    ],
    groups: [
        { command: "todayquote", description: "Get today's quote" },
        { command: "randomquote", description: "Get a random quote" },
        { command: "subscribe", description: "Send a quote here every morning at 6 AM WIB (admins)" },
        { command: "unsubscribe", description: "Stop the daily quote in this group (admins)" },
    ],
    admin: [
        { command: "stats", description: "Subscriber statistics" },
        { command: "broadcast", description: "Message all subscribers" },
    ],
};

module.exports = {
    BOT_USERNAME,
    start,
    todayQuote,
    randomQuote,
    subscribe,
    unsubscribe,
    stats,
    broadcast,
    adminCommands,
    generalCommands,
    commandRegex,
    isKnownCommand,
    commandMenus,
};
