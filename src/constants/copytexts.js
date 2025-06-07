const quoteOfTheDay = "💭 Quote of the day:";

const commandInstructions =
    "Hello! 👋🏼\n\nHere are the commands you can use:\n\n" +
    "/todayquote - Get today's quote\n" +
    "/randomquote - Get a random quote\n" +
    "/subscribe - Subscribe to daily quotes\n" +
    "/unsubscribe - Unsubscribe from daily quotes\n";
const commandInstructionsAdmin =
    "Hello Admin! 👋🏼\n\nHere are the commands you can use:\n\n" +
    "/stats - Get subscriber statistics\n" +
    "/broadcast [message] - Broadcast a message to all subscribers";

const subscriptionTexts = {
    subscribed: "🎉 You are now subscribed to daily quotes! You'll receive a new quote every day.",
    alreadySubscribed: "You're already subscribed to daily quotes! 😊",
    unsubscribed: "😢 You've been unsubscribed from daily quotes. You won't receive any more quotes automatically.",
    notSubscribed: "You're not currently subscribed to daily quotes.",
    error: "❌ Sorry, there was a problem with your subscription. Please try again later.",
};

module.exports = {
    quoteOfTheDay,
    commandInstructions,
    commandInstructionsAdmin,
    subscriptionTexts,
};
