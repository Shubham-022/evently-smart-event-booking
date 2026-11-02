-- 20261102_add_event_seats.sql
-- Migration: Add event_seats and booking_seats tables for interactive seating & real-time locking

CREATE TABLE IF NOT EXISTS event_seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    row_label VARCHAR(5) NOT NULL,
    seat_index INT NOT NULL,
    ticket_category VARCHAR(50) NOT NULL DEFAULT 'General',
    status ENUM('available', 'booked') NOT NULL DEFAULT 'available',
    booking_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_seats_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_seats_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    UNIQUE KEY uq_event_seat_number (event_id, seat_number),
    INDEX idx_event_seats_event (event_id),
    INDEX idx_event_seats_status (event_id, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS booking_seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    seat_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_seats_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_seats_seat FOREIGN KEY (seat_id) REFERENCES event_seats(id) ON DELETE CASCADE,
    UNIQUE KEY uq_booking_seat (booking_id, seat_id),
    INDEX idx_booking_seats_booking (booking_id)
) ENGINE=InnoDB;

