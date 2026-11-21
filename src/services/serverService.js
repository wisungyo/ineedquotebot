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

    const host = process.env.HOST || "127.0.0.1";
    app.listen(port, host, () => {
        console.log(`✅ Web server running on ${host}:${port}`);
    });

    return app;
}

module.exports = {
    initializeServer,
};
