const { quoteOfTheDay } = require("../../constant");
const quotesFilePath = "./quotes.json";
const axios = require("axios");
const fs = require("fs");

/**
 * @var {String} variable to store quote of the day
 */
let todayQuote = "";

/**
 * Get a quote based on type (today or random)
 * @param {String} type - The type of quote to fetch ('today' or 'random')
 * @returns {String} The formatted quote
 */
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

async function setTodayQuote() {
    try {
        todayQuote = await getQuote("today");
    } catch (error) {
        console.error("Error setting today's quote:", error);
    }
}

async function getTodayQuote() {
    if (!todayQuote) {
        await setTodayQuote();
    }
    return todayQuote;
}

module.exports = {
    getQuote,
    setTodayQuote,
    getTodayQuote,
};
