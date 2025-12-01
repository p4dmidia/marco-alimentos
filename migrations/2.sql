
CREATE TABLE commission_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level INTEGER NOT NULL UNIQUE,
  percentage REAL NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO commission_settings (level, percentage) VALUES 
  (1, 14.29),
  (2, 7.14),
  (3, 2.86);

CREATE TABLE subscription_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly',
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO subscription_plans (name, price) VALUES ('Cesta Básica Premium', 350.00);

ALTER TABLE orders ADD COLUMN subscription_plan_id INTEGER;
ALTER TABLE orders ADD COLUMN next_billing_date DATE;
