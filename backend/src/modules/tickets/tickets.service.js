const crypto = require("crypto");

const { prisma } = require("../../database/client");
const { HttpError } = require("../../common/errors/http-error");

function mapEvent(event) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    category: event.category,
    dateTime: event.dateTime,
    duration: event.duration,
    venue: event.venue,
    address: event.address,
    minAge: event.minAge,
    posterUrl: event.posterUrl,
    status: event.status,
  };
}

function mapSeat(seat) {
  return {
    seatId: seat.id,
    row: seat.rowNumber,
    number: seat.seatNumber,
    sector: seat.sector,
    price: Number(seat.price),
    status: seat.status,
  };
}

function generateMockQrCode({ ticketId, seatId }) {
  const payload = JSON.stringify({ ticketId, seatId, ts: Date.now() });
  return Buffer.from(payload).toString("base64url");
}

function generateMockPdfUrl(ticketId) {
  return `/mock-storage/tickets/${ticketId}.pdf`;
}

async function issueTicketsForBookingItems(tx, bookingItems) {
  for (const item of bookingItems) {
    const ticketId = crypto.randomUUID();
    await tx.ticket.upsert({
      where: { bookingItemId: item.id },
      create: {
        id: ticketId,
        bookingItemId: item.id,
        qrCode: generateMockQrCode({ ticketId, seatId: item.seatId }),
        pdfUrl: generateMockPdfUrl(ticketId),
      },
      update: {},
    });
  }
}

async function getTicketById(userId, ticketId) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      bookingItem: { booking: { userId } },
    },
    include: {
      bookingItem: {
        include: {
          seat: true,
          booking: { include: { event: true } },
        },
      },
    },
  });

  if (!ticket) {
    throw new HttpError(404, "Ticket not found");
  }

  return {
    ticketId: ticket.id,
    event: mapEvent(ticket.bookingItem.booking.event),
    seat: mapSeat(ticket.bookingItem.seat),
    qrCode: ticket.qrCode,
    isUsed: ticket.isUsed,
    issuedAt: ticket.issuedAt,
  };
}

function escapePdfText(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildTicketPdfBuffer({ ticketId, eventTitle, seatLabel, qrCode }) {
  const lines = [
    "WeTicket",
    `Ticket: ${ticketId}`,
    `Event: ${eventTitle}`,
    `Seat: ${seatLabel}`,
    `QR: ${qrCode.slice(0, 48)}...`,
  ];
  const streamContent = lines.map((line) => `(${escapePdfText(line)}) Tj T*`).join("\n");
  const stream = `BT /F1 12 Tf 50 750 Td ${streamContent} ET`;
  const streamLength = Buffer.byteLength(stream, "utf8");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${streamLength} >> stream\n${stream}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${obj}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

async function getTicketPdf(userId, ticketId) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      bookingItem: { booking: { userId, status: "paid" } },
    },
    include: {
      bookingItem: {
        include: {
          seat: true,
          booking: { include: { event: true } },
        },
      },
    },
  });

  if (!ticket) {
    throw new HttpError(404, "Ticket not found");
  }

  const seat = ticket.bookingItem.seat;
  const seatLabel = `${seat.rowNumber}-${seat.seatNumber}`;

  return {
    filename: `ticket-${ticketId}.pdf`,
    buffer: buildTicketPdfBuffer({
      ticketId,
      eventTitle: ticket.bookingItem.booking.event.title,
      seatLabel,
      qrCode: ticket.qrCode,
    }),
  };
}

async function validateQrCode(qrCode) {
  const ticket = await prisma.ticket.findUnique({
    where: { qrCode },
    include: {
      bookingItem: {
        include: {
          seat: true,
          booking: { include: { event: true } },
        },
      },
    },
  });

  if (!ticket) {
    return { valid: false };
  }

  return {
    valid: true,
    ticketId: ticket.id,
    event: {
      id: ticket.bookingItem.booking.event.id,
      title: ticket.bookingItem.booking.event.title,
    },
    seat: `${ticket.bookingItem.seat.rowNumber}-${ticket.bookingItem.seat.seatNumber}`,
    isUsed: ticket.isUsed,
  };
}

module.exports = {
  issueTicketsForBookingItems,
  getTicketById,
  getTicketPdf,
  validateQrCode,
};
