const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const cron = require("node-cron");

require("dotenv").config();

const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(token, { polling: true });

async function getQuote(type = "today") {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const today = `${day}-${month}-${year}`;
    try {
        const response = await axios.get(`${process.env.ZENQUOTES_API_URL}/${type}`);
        const quoteData = response.data[0];
        return `💭 Quote of the day:\n\n${quoteData.q}\n- ${quoteData.a}\n\n${today}`;
    } catch (error) {
        console.error("Failed to fetch quote:", error.message);
        // Return a motivational quote about perseverance when API fails
        const fallbackQuotes = [
            "The only failure is giving up.\n- Richard Nixon",
            "Success is not final, failure is not fatal: It is the courage to continue that counts.\n- Winston Churchill",
            "Failure is simply the opportunity to begin again, this time more intelligently.\n- Henry Ford",
            "It's not whether you get knocked down, it's whether you get up.\n- Vince Lombardi",
            "Our greatest glory is not in never falling, but in rising every time we fall.\n- Confucius",
            "Success is stumbling from failure to failure with no loss of enthusiasm.\n- Winston Churchill",
            "Every adversity carries with it the seed of an equal or greater benefit.\n- Napoleon Hill",
            "The greatest glory in living lies not in never falling, but in rising every time we fall.\n- Nelson Mandela",
        ];
        const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
        return `💭 Quote during tough times:\n\n${fallbackQuotes[randomIndex]}\n\n${today}`;
    }
}

bot.onText(/\/todayquote/, async (msg) => {
    const date = new Date();
    console.log("Today quote command received on", date.toISOString());
    try {
        const quote = await getQuote();
        bot.sendMessage(chatId, quote);
    } catch (error) {
        console.error("Error fetching quote:", error);
    }
});

bot.onText(/\/randomquote/, async (msg) => {
    const date = new Date();
    console.log("Random quote command received on", date.toISOString());
    try {
        const quote = await getQuote("random");
        bot.sendMessage(chatId, quote);
    } catch (error) {
        console.error("Error fetching quote:", error);
    }
});

// Schedule a daily job at 6 AM to send the quote of the day
cron.schedule("0 6 * * *", async () => {
    try {
        const quote = await getQuote();
        bot.sendMessage(chatId, quote);
    } catch (error) {
        console.error("Error in cron job:", error);
    }
});
