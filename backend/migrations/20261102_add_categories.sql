-- Migration: 20261102_add_categories.sql
-- Add category to events and ticket_category to bookings

-- 1. Add category to events table if not exists
SET @dbname = DATABASE();
SET @tablename = "events";
SET @columnname = "category";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  "ALTER TABLE events ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'Technology' AFTER title, ADD INDEX idx_events_category (category);"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Add ticket_category to bookings table if not exists
SET @tablename = "bookings";
SET @columnname = "ticket_category";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  "ALTER TABLE bookings ADD COLUMN ticket_category VARCHAR(50) NOT NULL DEFAULT 'General' AFTER quantity;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

