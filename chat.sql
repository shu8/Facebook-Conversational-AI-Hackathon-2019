CREATE TABLE IF NOT EXISTS users (
    user_psid INTEGER PRIMARY KEY,
    user_first_name TEXT,
    user_last_name TEXT
);

CREATE TABLE IF NOT EXISTS messages (
    sender_psid INTEGER NOT NULL,
    recipient_psid INTEGER NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    message TEXT NOT NULL,
    PRIMARY KEY (sender_psid, recipient_psid, timestamp)
);
