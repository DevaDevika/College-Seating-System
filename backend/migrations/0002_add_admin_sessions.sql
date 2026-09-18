-- Migration number: 0002

CREATE TABLE admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    admin_id INTEGER NOT NULL,

    token_hash TEXT NOT NULL UNIQUE,

    expires_at TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (admin_id)
        REFERENCES admins(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_admin_sessions_token
    ON admin_sessions(token_hash);

CREATE INDEX idx_admin_sessions_expires
    ON admin_sessions(expires_at);