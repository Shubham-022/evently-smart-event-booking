// src/utils/ticketDownload.js
/**
 * Renders a high-resolution, branded digital ticket to an offscreen canvas and downloads it as a PNG image.
 */
export async function downloadTicketAsImage(booking, qrSvgElement) {
  return new Promise((resolve, reject) => {
    try {
      const scale = 2; // High-res 2x
      const width = 850 * scale;
      const height = 480 * scale;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // 1. Background
      ctx.fillStyle = '#0B0818';
      ctx.fillRect(0, 0, width, height);

      // Gradient accent top bar
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, '#8B5CF6');
      grad.addColorStop(0.5, '#A855F7');
      grad.addColorStop(1, '#EC4899');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, 14 * scale);

      // Gradient glow orb behind ticket
      const radGrad = ctx.createRadialGradient(width * 0.2, height * 0.3, 10, width * 0.2, height * 0.3, 300 * scale);
      radGrad.addColorStop(0, 'rgba(139, 92, 246, 0.18)');
      radGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);

      // Card border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2 * scale;
      ctx.strokeRect(10 * scale, 10 * scale, width - 20 * scale, height - 20 * scale);

      // 2. Header Brand
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${24 * scale}px sans-serif`;
      ctx.fillText('Evently', 40 * scale, 55 * scale);

      ctx.fillStyle = '#A78BFA';
      ctx.font = `bold ${11 * scale}px sans-serif`;
      ctx.fillText('OFFICIAL DIGITAL TICKET', 140 * scale, 52 * scale);

      // Booking Reference pill
      ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
      ctx.beginPath();
      ctx.roundRect(width - 240 * scale, 35 * scale, 200 * scale, 32 * scale, 8 * scale);
      ctx.fill();
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
      ctx.stroke();

      ctx.fillStyle = '#C4B5FD';
      ctx.font = `bold ${13 * scale}px monospace`;
      ctx.fillText(`ID: #${String(booking.id).padStart(6, '0')}`, width - 220 * scale, 56 * scale);

      // Perforated separator line
      const stubX = width - 260 * scale;
      ctx.setLineDash([8 * scale, 6 * scale]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.moveTo(stubX, 20 * scale);
      ctx.lineTo(stubX, height - 20 * scale);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Notches at the stub top and bottom
      ctx.fillStyle = '#07060F';
      ctx.beginPath();
      ctx.arc(stubX, 10 * scale, 14 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(stubX, height - 10 * scale, 14 * scale, 0, Math.PI * 2);
      ctx.fill();

      // 3. Left Section - Event Info
      // Event Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${28 * scale}px sans-serif`;
      const title = booking.title || 'Event Booking';
      const maxTitleWidth = stubX - 70 * scale;
      ctx.fillText(title.length > 32 ? title.slice(0, 30) + '…' : title, 40 * scale, 115 * scale);

      // Grid of Details
      const details = [
        {
          label: 'DATE & TIME',
          value: booking.event_date
            ? new Date(booking.event_date).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : 'N/A',
        },
        {
          label: 'VENUE',
          value: (booking.location || 'Venue TBA').length > 28 ? (booking.location || '').slice(0, 26) + '…' : (booking.location || 'Venue TBA'),
        },
        {
          label: 'ATTENDEE',
          value: (booking.name || 'Attendee').length > 22 ? (booking.name || '').slice(0, 20) + '…' : (booking.name || 'Attendee'),
        },
        {
          label: 'TIER & SEATS',
          value: `${(booking.ticket_category || 'General').toUpperCase()} • ${booking.quantity} Ticket${booking.quantity > 1 ? 's' : ''}`,
        },
        {
          label: 'STATUS',
          value: (booking.status || 'Confirmed').toUpperCase(),
        },
        {
          label: 'TOTAL PAID',
          value: `₹${Number(booking.total_amount).toLocaleString('en-IN')}`,
        },
      ];

      const startY = 170 * scale;
      const rowGap = 65 * scale;
      const colGap = 250 * scale;

      details.forEach((d, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 40 * scale + col * colGap;
        const y = startY + row * rowGap;

        ctx.fillStyle = '#6B7280';
        ctx.font = `bold ${10 * scale}px sans-serif`;
        ctx.fillText(d.label, x, y);

        ctx.fillStyle = d.label === 'STATUS' ? '#34D399' : d.label === 'TOTAL PAID' ? '#A78BFA' : '#FFFFFF';
        ctx.font = `bold ${15 * scale}px sans-serif`;
        ctx.fillText(d.value, x, y + 22 * scale);
      });

      // Verification note
      ctx.fillStyle = '#6B7280';
      ctx.font = `${10 * scale}px sans-serif`;
      ctx.fillText('Please present this ticket and valid photo ID at venue entry.', 40 * scale, height - 35 * scale);

      // 4. Right Section - QR Code & Validation
      const qrBoxSize = 160 * scale;
      const qrBoxX = stubX + (width - stubX - qrBoxSize) / 2;
      const qrBoxY = 100 * scale;

      // QR white backdrop card
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(qrBoxX - 12 * scale, qrBoxY - 12 * scale, qrBoxSize + 24 * scale, qrBoxSize + 24 * scale, 14 * scale);
      ctx.fill();

      // Convert SVG QR code to Image and draw
      const svgData = new XMLSerializer().serializeToString(qrSvgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const qrImg = new Image();
      qrImg.onload = () => {
        ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
        URL.revokeObjectURL(blobURL);

        // QR Labels below code
        ctx.fillStyle = '#9CA3AF';
        ctx.font = `${11 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('SCAN FOR ENTRY', stubX + (width - stubX) / 2, qrBoxY + qrBoxSize + 30 * scale);

        ctx.fillStyle = '#8B5CF6';
        ctx.font = `bold ${10 * scale}px monospace`;
        ctx.fillText(`EVENTLY-BOOKING-${booking.id}`, stubX + (width - stubX) / 2, qrBoxY + qrBoxSize + 48 * scale);

        // Bottom accent
        ctx.fillStyle = grad;
        ctx.fillRect(0, height - 8 * scale, width, 8 * scale);

        // Trigger Download
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `evently-ticket-${booking.id}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        resolve(true);
      };

      qrImg.onerror = (e) => {
        URL.revokeObjectURL(blobURL);
        reject(e);
      };

      qrImg.src = blobURL;
    } catch (err) {
      reject(err);
    }
  });
}

