const todayQuote = "/todayquote";
const randomQuote = "/randomquote";
const subscribe = "/subscribe";
const unsubscribe = "/unsubscribe";

const stats = "/stats";
const broadcast = "/broadcast";

const generalCommands = [todayQuote, randomQuote, subscribe, unsubscribe];
const adminCommands = [stats, broadcast];

/**
 * Check whether a message starts with a known command (e.g. "/broadcast hello")
 * @param {String} text - Incoming message text
 * @returns {Boolean}
 */
const isKnownCommand = (text = "") => {
    const command = text.trim().split(/\s/)[0].split("@")[0];
    return generalCommands.includes(command) || adminCommands.includes(command);
};

module.exports = {
    todayQuote,
    randomQuote,
    subscribe,
    unsubscribe,
    stats,
    broadcast,
    adminCommands,
    generalCommands,
    isKnownCommand,
};
