CREATE TABLE IF NOT EXISTS users (
    user_psid INTEGER PRIMARY KEY,
    user_first_name TEXT,
    user_last_name TEXT
);

CREATE TABLE IF NOT EXISTS messages (
    sender_psid INTEGER,
    recipient_psid INTEGER,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    message TEXT,
    PRIMARY KEY (sender_psid, recipient_psid, timestamp)
);
