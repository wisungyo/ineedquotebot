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

-- v2: groups support
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS chat_type TEXT NOT NULL DEFAULT 'private';
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS chat_title TEXT;

-- v3: persisted quote of the day (no repeats across days)
CREATE TABLE IF NOT EXISTS daily_quotes (
    date_key   DATE PRIMARY KEY,
    text       TEXT NOT NULL,
    author     TEXT NOT NULL,
    source     TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
