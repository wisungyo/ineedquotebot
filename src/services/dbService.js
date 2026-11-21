const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL pool error:", err.message);
});

/**
 * Initialize the database connection, ensure schema exists, and test it
 * @returns {Promise<void>}
 */
async function initializeConnection() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS subscribers (
                id              SERIAL PRIMARY KEY,
                chat_id         BIGINT UNIQUE NOT NULL,
                username        TEXT,
                first_name      TEXT,
                last_name       TEXT,
                subscribed      BOOLEAN NOT NULL DEFAULT TRUE,
                subscribed_at   TIMESTAMPTZ DEFAULT NOW(),
                unsubscribed_at TIMESTAMPTZ
            )
        `);
        await pool.query("SELECT 1 FROM subscribers LIMIT 1");
        console.log("✅ Successfully connected to PostgreSQL database");
    } catch (error) {
        console.error("❌ Failed to connect to PostgreSQL database:", error.message);
        throw error;
    }
}

/**
 * Store a new subscriber (or re-subscribe an existing one)
 * @param {Object} user - The user object from Telegram
 * @param {Number} chatId - The chat ID to subscribe
 * @returns {Promise<Object|null>} - The subscriber row, or null on failure
 */
async function subscribe(user, chatId) {
    try {
        const { username, first_name, last_name } = user;
        const { rows } = await pool.query(
            `INSERT INTO subscribers (chat_id, username, first_name, last_name, subscribed, subscribed_at)
             VALUES ($1, $2, $3, $4, TRUE, NOW())
             ON CONFLICT (chat_id) DO UPDATE
                SET subscribed = TRUE,
                    subscribed_at = NOW(),
                    username = COALESCE(EXCLUDED.username, subscribers.username),
                    first_name = COALESCE(EXCLUDED.first_name, subscribers.first_name),
                    last_name = COALESCE(EXCLUDED.last_name, subscribers.last_name)
             RETURNING *`,
            [chatId, username || null, first_name || null, last_name || null]
        );
        console.log(`✅ Subscriber ${chatId} (${username || first_name || last_name}) subscribed successfully.`);
        return rows[0] || null;
    } catch (error) {
        console.error("Error storing subscriber:", error.message);
        return null;
    }
}

/**
 * Unsubscribe a chat
 * @param {Number} chatId - The chat ID to unsubscribe
 * @returns {Promise<Boolean>} - Whether unsubscription was successful
 */
async function unsubscribe(chatId) {
    try {
        const { rowCount } = await pool.query(
            `UPDATE subscribers SET subscribed = FALSE, unsubscribed_at = NOW() WHERE chat_id = $1`,
            [chatId]
        );
        if (rowCount > 0) {
            console.log(`✅ Subscriber ${chatId} unsubscribed successfully.`);
            return true;
        }
        console.log(`❌ Subscriber ${chatId} not found.`);
        return false;
    } catch (error) {
        console.error("Error removing subscriber:", error.message);
        return false;
    }
}

/**
 * Get all active subscribers
 * @returns {Promise<Array>} - List of subscriber chat IDs
 */
async function getAllSubscribers() {
    try {
        const { rows } = await pool.query(`SELECT chat_id FROM subscribers WHERE subscribed = TRUE`);
        if (rows.length === 0) console.log("No subscribers found.");
        // BIGINT is returned as a string by pg; Telegram accepts string chat IDs
        return rows.map((r) => r.chat_id);
    } catch (error) {
        console.error("Error getting subscribers:", error.message);
        return [];
    }
}

/**
 * Check if a chat ID is subscribed
 * @param {Number} chatId - The chat ID to check
 * @returns {Promise<Boolean>}
 */
async function isSubscribed(chatId) {
    try {
        const { rows } = await pool.query(
            `SELECT 1 FROM subscribers WHERE chat_id = $1 AND subscribed = TRUE`,
            [chatId]
        );
        return rows.length > 0;
    } catch (error) {
        console.error("Error checking subscription status:", error.message);
        return false;
    }
}

module.exports = {
    initializeConnection,
    subscribe,
    unsubscribe,
    getAllSubscribers,
    isSubscribed,
};
