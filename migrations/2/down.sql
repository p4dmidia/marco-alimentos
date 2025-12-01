
ALTER TABLE orders DROP COLUMN next_billing_date;
ALTER TABLE orders DROP COLUMN subscription_plan_id;
DROP TABLE subscription_plans;
DROP TABLE commission_settings;
