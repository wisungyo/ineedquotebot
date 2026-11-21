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

-- v3: rendered quote cards (Telegram file_id cache, used for sharing)
CREATE TABLE IF NOT EXISTS quote_cards (
    id          SERIAL PRIMARY KEY,
    quote_text  TEXT NOT NULL,
    author      TEXT NOT NULL,
    style       TEXT NOT NULL,
    file_id     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (quote_text, author, style)
);
