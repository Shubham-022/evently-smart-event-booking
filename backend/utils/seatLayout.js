// backend/utils/seatLayout.js

/**
 * Convert 0-indexed row number into spreadsheet-like row letter (0 -> 'A', 25 -> 'Z', 26 -> 'AA', etc.)
 */
export function getRowLabel(rowIndex) {
  let label = '';
  let n = rowIndex;
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

/**
 * Determine a clean, responsive number of columns per row based on total event capacity
 */
export function calculateColsPerRow(totalSeats) {
  const total = Number(totalSeats) || 10;
  if (total <= 12) return Math.min(total, 4);
  if (total <= 24) return 6;
  if (total <= 60) return 10;
  if (total <= 150) return 10;
  if (total <= 300) return 12;
  return 15;
}

/**
 * Generate full seat layout metadata array for a given capacity
 */
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

    // Distribute tiers realistically:
    // Front ~20% of rows: VIP
    // Middle ~35% of rows: Premium
    // Rear ~45% of rows: General
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
        seatNumber,
        rowLabel,
        seatIndex: c,
        ticketCategory: category,
      });
    }
  }

  return seats;
}

