// frontend/src/utils/seatLayout.js

export function getRowLabel(rowIndex) {
  let label = '';
  let n = rowIndex;
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

export function calculateColsPerRow(totalSeats) {
  const total = Number(totalSeats) || 10;
  if (total <= 12) return Math.min(total, 4);
  if (total <= 24) return 6;
  if (total <= 60) return 10;
  if (total <= 150) return 10;
  if (total <= 300) return 12;
  return 15;
}

export function generateSeatsForTotal(totalSeats) {
  const total = Number(totalSeats);
  if (!total || total <= 0) return [];

  const cols = calculateColsPerRow(total);
  const rowsCount = Math.ceil(total / cols);

  const seats = [];
  let seatCount = 0;

  for (let r = 0; r < rowsCount && seatCount < total; r++) {
    const rowLabel = getRowLabel(r);
    const rowRatio = r / rowsCount;

    let category = 'General';
    if (rowRatio < 0.20 || r === 0) {
      category = 'VIP';
    } else if (rowRatio < 0.55) {
      category = 'Premium';
    } else {
      category = 'General';
    }

    for (let c = 1; c <= cols && seatCount < total; c++) {
      seatCount++;
      const seatNumber = `${rowLabel}${c}`;
      seats.push({
        id: seatCount,
        seatNumber,
        rowLabel,
        seatIndex: c,
        ticketCategory: category,
        status: 'available',
      });
    }
  }

  return seats;
}

/**
 * Generate fallback seats when the backend seat table is unpopulated,
 * accurately reflecting available and booked seat counts from event metadata.
 */
export function generateFallbackSeats(totalSeats, availableSeats) {
  const total = Number(totalSeats) || 0;
  const avail = availableSeats !== undefined && availableSeats !== null ? Number(availableSeats) : total;
  const bookedCount = Math.max(0, total - avail);

  const seats = generateSeatsForTotal(total);

  // Mark the last `bookedCount` seats as booked to preserve front/available seating
  for (let i = 0; i < seats.length; i++) {
    if (i >= seats.length - bookedCount) {
      seats[i].status = 'booked';
    } else {
      seats[i].status = 'available';
    }
  }

  return seats;
}

