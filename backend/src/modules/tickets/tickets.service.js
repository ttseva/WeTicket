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
  validateQrCode,
};
