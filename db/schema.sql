CREATE TABLE IF NOT EXISTS subscribers (
    id              SERIAL PRIMARY KEY,
    chat_id         BIGINT UNIQUE NOT NULL,
    username        TEXT,
    first_name      TEXT,
    last_name       TEXT,
    subscribed      BOOLEAN NOT NULL DEFAULT TRUE,
    subscribed_at   TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_subscribers_subscribed ON subscribers (subscribed);
