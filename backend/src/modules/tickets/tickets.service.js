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

function getPdfFontPath() {
  const candidates = [
    process.env.PDF_FONT_PATH,
    path.resolve(__dirname, "../../../node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf"),
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial Unicode.ttf",
  ].filter(Boolean);

  return candidates.find((fontPath) => fs.existsSync(fontPath));
}

function buildTicketPdfBuffer({ ticketId, eventTitle, seatLabel, qrCode }) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: `Ticket ${ticketId}`,
        Creator: "WeTicket",
      },
    });

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const fontPath = getPdfFontPath();
    if (fontPath) {
      doc.font(fontPath);
    }

    doc.fontSize(24).text("WeTicket", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(18).text("Электронный билет", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(12);
    doc.text(`ID билета: ${ticketId}`);
    doc.moveDown(0.75);
    doc.text(`Мероприятие: ${eventTitle}`);
    doc.moveDown(0.75);
    doc.text(`Место: ${seatLabel}`);
    doc.moveDown(1.5);

    doc.fontSize(14).text("QR-код для проверки");
    doc.moveDown(0.5);
    doc.fontSize(10).text(qrCode, {
      width: 420,
      continued: false,
    });

    doc.moveDown(2);
    doc.fontSize(10).fillColor("#666666").text(
      "Предъявите этот билет на входе. QR-код должен быть доступен для сканирования.",
    );

    doc.end();
  });
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
    buffer: await buildTicketPdfBuffer({
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
