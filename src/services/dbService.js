const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(process.env.DATABASE_URL, process.env.API_KEY);

/**
 * Initialize the database connection and test it
 * @returns {Promise<void>}
 */
async function initializeConnection() {
    try {
        // Test the connection
        const { data, error } = await supabase.from("subscribers").select("*").limit(1);
        if (error) throw new Error(`Supabase connection error: ${error.message}`);
        console.log("✅ Successfully connected to PostgreSQL database");
    } catch (error) {
        console.error("❌ Failed to connect to PostgreSQL database:", error.message);
        throw error;
    }
}

/**
 * Store a new subscriber
 * @param {Object} user - The user object from Telegram
 * @param {Number} chatId - The chat ID to subscribe
 * @returns {Promise<Boolean>} - Whether subscription was successful
 */
async function subscribe(user, chatId) {
    try {
        const { username, first_name, last_name } = user;

        const isExists = await isSubscriberExists(chatId);
        if (isExists) {
            const result = await updateSubscriber(chatId, {
                subscribed: true,
                subscribed_at: new Date().toISOString(),
            });
            if (result) {
                console.log(`✅ Subscriber ${chatId} (${username || first_name || last_name}) updated successfully.`);
                return result;
            } else {
                console.log(`❌ Failed to update subscriber ${chatId}.`);
                return null;
            }
        }

        const result = await insertSubscriber(chatId, username, first_name, last_name);
        if (result) {
            console.log(`✅ Subscriber ${chatId} (${username || first_name || last_name}) added successfully.`);
            return result;
        } else {
            console.log(`❌ Failed to add subscriber ${chatId}.`);
            return null;
        }
    } catch (error) {
        console.error("Error storing subscriber:", error);
        return null;
    }
}

/**
 * Remove a subscriber
 * @param {Number} chatId - The chat ID to unsubscribe
 * @returns {Promise<Boolean>} - Whether unsubscription was successful
 */
async function unsubscribe(chatId) {
    try {
        const { data: result, error } = await supabase
            .from("subscribers")
            .update({ subscribed: false, unsubscribed_at: new Date().toISOString() })
            .eq("chat_id", chatId)
            .select("*")
            .single();
        if (error) {
            console.error("Error unsubscribing:", error.message);
            return false;
        }
        if (result) {
            console.log(`✅ Subscriber ${chatId} unsubscribed successfully.`);
            return true;
        } else {
            console.log(`❌ Subscriber ${chatId} not found.`);
            return false;
        }
    } catch (error) {
        console.error("Error removing subscriber:", error);
        return false;
    }
}

/**
 * Get all subscribers
 * @returns {Promise<Array>} - List of subscriber chat IDs
 */
async function getAllSubscribers() {
    try {
        const { data: subscribers, error } = await supabase
            .from("subscribers")
            .select("chat_id")
            .eq("subscribed", true);
        if (error) {
            console.error("Error fetching subscribers:", error.message);
            return [];
        }
        if (subscribers.length === 0) {
            console.log("No subscribers found.");
            return [];
        }
        return subscribers.map((subscriber) => subscriber.chat_id);
    } catch (error) {
        console.error("Error getting subscribers:", error);
        return [];
    }
}

/**
 * Check if a chat ID is subscribed
 * @param {Number} chatId - The chat ID to check
 * @returns {Promise<Boolean>} - Whether the chat ID is subscribed
 */
async function isSubscribed(chatId) {
    try {
        // const result = await pool.query(`SELECT * FROM subscribers WHERE chat_id = $1 AND subscribed = TRUE`, [chatId]);
        // return result.rows.length > 0;
        const { data: result, error } = await supabase
            .from("subscribers")
            .select("*")
            .eq("chat_id", chatId)
            .eq("subscribed", true)
            .single();
        if (error) {
            console.error("Error checking subscription status:", error.message);
            return false;
        }
        if (result) {
            console.log(`✅ Chat ID ${chatId} is subscribed.`);
            return true;
        } else {
            console.log(`❌ Chat ID ${chatId} is not subscribed.`);
            return false;
        }
    } catch (error) {
        console.error("Error checking subscription status:", error);
        return false;
    }
}

async function isSubscriberExists(chatId) {
    try {
        const { data: result, error } = await supabase.from("subscribers").select("*").eq("chat_id", chatId).single();
        if (error) {
            console.error("Error checking subscriber existence:", error.message);
            return false;
        }
        return !!result;
    } catch (error) {
        console.error("Error checking subscriber existence:", error);
        return false;
    }
}

async function insertSubscriber(chatId, username, firstName, lastName) {
    try {
        const { data: result, error } = await supabase
            .from("subscribers")
            .insert({
                chat_id: chatId,
                username: username || null,
                first_name: firstName || null,
                last_name: lastName || null,
                subscribed: true,
                subscribed_at: new Date().toISOString(),
            })
            .select("*")
            .single();
        if (error) {
            console.error("Error inserting subscriber:", error.message);
            return false;
        }
        console.log(`✅ Subscriber ${chatId} (${username || firstName || lastName}) added successfully.`);
        return result;
    } catch (error) {
        console.error("Error inserting subscriber:", error);
        return false;
    }
}

async function updateSubscriber(chatId, updates) {
    try {
        const { data: result, error } = await supabase
            .from("subscribers")
            .update(updates)
            .eq("chat_id", chatId)
            .select("*")
            .single();
        if (error) {
            console.error("Error updating subscriber:", error.message);
            return false;
        }
        console.log(`✅ Subscriber ${chatId} updated successfully.`);
        return result;
    } catch (error) {
        console.error("Error updating subscriber:", error);
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
