
CREATE TABLE admin_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_credentials_username ON admin_credentials(username);

-- Create a default admin account (username: admin, password: admin123)
-- Password hash for 'admin123' using a simple implementation
INSERT INTO admin_credentials (username, password_hash) VALUES ('admin', 'admin123');
