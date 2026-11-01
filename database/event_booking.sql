-- Smart Event Booking System Schema
-- Database: smart_event_booking
-- ------------------------------------------------------------
-- NOTE: This script creates the required tables and constraints.
-- Run this script in MySQL Workbench (or via mysql CLI) after creating the database.

-- 1. Create the database (if not already created)
CREATE DATABASE IF NOT EXISTS smart_event_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_event_booking;

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mobile VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- 3. Admins table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admins_email (email)
) ENGINE=InnoDB;

-- 4. Events table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Technology',
    description TEXT NULL,
    location VARCHAR(255) NOT NULL,
    `date` DATETIME NOT NULL,
    total_seats INT NOT NULL CHECK (total_seats >= 0),
    available_seats INT NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    img VARCHAR(500) NULL,
    CONSTRAINT chk_available_seats CHECK (available_seats >= 0 AND available_seats <= total_seats),
    INDEX idx_events_date (`date`),
    INDEX idx_events_location (location),
    INDEX idx_events_category (category),
    INDEX idx_events_date_location (`date`, location)
) ENGINE=InnoDB;

-- 5. Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    event_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    ticket_category VARCHAR(50) NOT NULL DEFAULT 'General',
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_bookings_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT,
    INDEX idx_bookings_user (user_id),
    INDEX idx_bookings_event (event_id),
    INDEX idx_bookings_status (status)
) ENGINE=InnoDB;

-- End of schema
