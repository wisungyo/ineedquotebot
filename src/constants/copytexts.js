const { BOT_USERNAME } = require("./commands");

const quoteOfTheDay = "💭 Quote of the day:";

const commandInstructions =
    "Hello! 👋🏼\n\nHere are the commands you can use:\n\n" +
    "/todayquote - Get today's quote\n" +
    "/randomquote - Get a random quote\n" +
    "/subscribe - Get a quote every morning at 6 AM (WIB)\n" +
    "/unsubscribe - Stop the daily quote\n\n" +
    `💡 Type @${BOT_USERNAME} in any chat to send a quote to a friend, or add me to a group!`;
const commandInstructionsAdmin =
    "Hello Admin! 👋🏼\n\nHere are the commands you can use:\n\n" +
    "/stats - Get subscriber statistics\n" +
    "/broadcast [message] - Broadcast a message to all subscribers";

const subscriptionTexts = {
    subscribed: "🎉 You're subscribed! See you tomorrow at 6 AM (WIB) with a fresh quote ☀️",
    subscribedGroup: "🎉 Done! I'll send a quote to this group every morning at 6 AM (WIB) ☀️",
    alreadySubscribed: "You're already subscribed to daily quotes! 😊",
    alreadySubscribedGroup: "This group already gets a daily quote! 😊",
    unsubscribed: "😢 You've been unsubscribed from daily quotes. You won't receive any more quotes automatically.",
    unsubscribedGroup: "😢 This group won't receive the daily quote anymore.",
    notSubscribed: "You're not currently subscribed to daily quotes.",
    notSubscribedGroup: "This group isn't subscribed to the daily quote.",
    adminsOnly: "Only group admins can change the daily quote for this group 🙏🏼",
    error: "❌ Sorry, there was a problem with your subscription. Please try again later.",
};

/**
 * Onboarding text for /start in a private chat (HTML)
 * @param {String} name - escaped first name
 * @param {Boolean} subscribed
 */
const welcomePrivate = (name, subscribed) =>
    subscribed
        ? `👋 Welcome back, <b>${name}</b>!\n\nYou're subscribed, so a fresh quote lands here every morning at 6 AM (WIB). Here's today's:`
        : `👋 Hi <b>${name}</b>, welcome to <b>I Need Quote</b>!\n\n` +
          `I send one short quote every morning at 6 AM (WIB) to start your day right. Here's today's one 👇`;

const startTips =
    `💡 <b>Tips</b>\n` +
    `• Type <code>@${BOT_USERNAME}</code> in any chat to send a quote to a friend\n` +
    `• Add me to a group and I'll post a quote there every morning`;

/**
 * Welcome text when the bot is added to a group (HTML)
 * @param {String} title - escaped group title
 */
const welcomeGroup = (title) =>
    `👋 Hi <b>${title}</b>! I'm <b>I Need Quote</b>.\n\n` +
    `I can post one short quote here every morning at 6 AM (WIB). Here's today's one 👇`;

module.exports = {
    quoteOfTheDay,
    commandInstructions,
    commandInstructionsAdmin,
    subscriptionTexts,
    welcomePrivate,
    welcomeGroup,
    startTips,
};
