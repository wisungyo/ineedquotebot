const { quoteOfTheDay, commandInstructions } = require("./constant");
const quotesFilePath = "./quotes.json";
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
const fs = require("fs");

require("dotenv").config();

const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(token, { polling: true });

const availableCommands = ["/todayquote", "/randomquote"];

let todayQuote = "";

async function getQuote(type = "today") {
    const date = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const today = `${day}-${month}-${year}`;
    try {
        const response = await axios.get(`${process.env.ZENQUOTES_API_URL}/${type}`);
        const quoteData = response.data[0];
        return `${quoteOfTheDay}\n\n${quoteData.q}\n- ${quoteData.a}\n\n${today}`;
    } catch (error) {
        console.error("Failed to fetch quote:", error.message);
        // Fallback to local quotes if API fails
        const quotesData = JSON.parse(fs.readFileSync(quotesFilePath));
        const randomIndex = Math.floor(Math.random() * quotesData.length);
        return `${quoteOfTheDay}\n\n${quotesData[randomIndex].quoteText}\n- ${quotesData[randomIndex].quoteAuthor}\n\n${today}`;
    }
}

bot.onText(/\/todayquote/, async (msg) => {
    try {
        const quote = todayQuote || (await getQuote());
        if (!todayQuote) {
            todayQuote = quote; // Set today's quote if not already set
        }
        bot.sendMessage(chatId, quote);
    } catch (error) {
        console.error("Error fetching quote:", error);
    }
});

bot.onText(/\/randomquote/, async (msg) => {
    try {
        const quote = await getQuote("random");
        bot.sendMessage(chatId, quote);
    } catch (error) {
        console.error("Error fetching quote:", error);
    }
});

bot.on("message", (msg) => {
    const date = new Date();
    console.log("Message received on", date.toISOString(), "from", msg.from.username || msg.from.id);
    // Ignore messages that are actually available commands
    if (availableCommands.includes(msg.text)) return;
    bot.sendMessage(chatId, commandInstructions);
});

// Schedule a daily job at 6 AM to send the quote of the day
cron.schedule("0 6 * * *", async () => {
    try {
        const quote = await getQuote();
        todayQuote = quote;
        bot.sendMessage(chatId, quote);
    } catch (error) {
        console.error("Error in cron job:", error);
    }
});

// Set today's quote on startup
(async () => {
    try {
        todayQuote = await getQuote();
        console.log("Today's quote set:", todayQuote);
    } catch (error) {
        console.error("Error setting today's quote on startup:", error);
    }
})();

// Start the Express server
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("🧠 I Need Quote bot is alive and running.");
});

app.listen(PORT, () => {
    console.log(`✅ Web server running on port ${PORT}`);
});
