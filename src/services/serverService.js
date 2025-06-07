const { initializeConnection } = require("./dbService");
const express = require("express");

/**
 * Initialize and start the Express server
 * @param {Number} port - The port to start the server on
 * @returns {Object} - The Express app instance
 */
function initializeServer(port = process.env.PORT || 3000) {
    const app = express();

    initializeConnection().catch((err) => {
        console.error("Database initialization error:", err);
    });

    app.get("/", (req, res) => {
        res.send("🧠 I Need Quote bot is alive and running.");
    });

    app.listen(port, () => {
        console.log(`✅ Web server running on port ${port}`);
    });

    return app;
}

module.exports = {
    initializeServer,
};
