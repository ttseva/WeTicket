const { PrismaClient, UserRole, EventCategory, EventStatus, SeatStatus, BookingStatus, PaymentMethod, PaymentStatus, GroupSessionStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin12345!", 10);
  const organizerPasswordHash = await bcrypt.hash("Organizer12345!", 10);
  const clientPasswordHash = await bcrypt.hash("Client12345!", 10);

  const clientUser = await prisma.user.upsert({
    where: { email: "client@weticket.ru" },
    update: {
      passwordHash: clientPasswordHash,
    },
    create: {
      email: "client@weticket.ru",
      passwordHash: clientPasswordHash,
      firstName: "Default",
      lastName: "Client",
      role: UserRole.client,
      isVerified: true,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@weticket.ru" },
    update: {
      passwordHash: adminPasswordHash,
    },
    create: {
      email: "admin@weticket.ru",
      passwordHash: adminPasswordHash,
      firstName: "System",
      lastName: "Admin",
      role: UserRole.admin,
      isVerified: true,
      adminProfile: {
        create: {
          department: "Operations",
        },
      },
    },
  });

  const organizerUser = await prisma.user.upsert({
    where: { email: "organizer@weticket.ru" },
    update: {
      passwordHash: organizerPasswordHash,
    },
    create: {
      email: "organizer@weticket.ru",
      passwordHash: organizerPasswordHash,
      firstName: "Main",
      lastName: "Organizer",
      role: UserRole.organizer,
      isVerified: true,
      organizerProfile: {
        create: {
          companyName: "WeTicket Org",
          verified: true,
        },
      },
    },
    include: {
      organizerProfile: true,
    },
  });

  const venue = await prisma.venue.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: {},
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      name: "WeTicket Hall",
      address: "Lenina st., 10",
      city: "Moscow",
      totalRows: 5,
      seatsPerRow: 8,
    },
  });

  const event = await prisma.event.upsert({
    where: { id: "22222222-2222-2222-2222-222222222222" },
    update: {},
    create: {
      id: "22222222-2222-2222-2222-222222222222",
      organizerId: organizerUser.organizerProfile.id,
      venueId: venue.id,
      title: "Prisma Launch Concert",
      description: "Demo seeded event for local development.",
      category: EventCategory.concert,
      dateTime: new Date("2026-06-01T18:00:00.000Z"),
      duration: 120,
      venue: venue.name,
      address: venue.address,
      city: venue.city,
      minAge: 12,
      status: EventStatus.active,
    },
  });

  const existingSeats = await prisma.seat.count({
    where: { eventId: event.id },
  });

  if (existingSeats === 0) {
    const seats = [];
    for (let row = 1; row <= 5; row += 1) {
      for (let seat = 1; seat <= 8; seat += 1) {
        seats.push({
          eventId: event.id,
          rowNumber: row,
          seatNumber: seat,
          price: row <= 2 ? 3500 : 2500,
          status: SeatStatus.free,
        });
      }
    }
    await prisma.seat.createMany({ data: seats });
  }


  let groupSession = await prisma.groupSession.findFirst({
    where: { leaderId: clientUser.id, eventId: event.id },
  });

  if (!groupSession) {
    groupSession = await prisma.groupSession.create({
      data: {
        leaderId: clientUser.id,
        eventId: event.id,
        inviteLink: "http://localhost:5174/group/join/default-invite-link",
        totalSeats: 4,
        participantsCount: 1,
        status: GroupSessionStatus.active,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), 
      },
    });
  }

  const freeSeats = await prisma.seat.findMany({
    where: { eventId: event.id, status: SeatStatus.free },
    orderBy: [{ rowNumber: "asc" }, { seatNumber: "asc" }],
  });

  const existingBooking = await prisma.booking.findFirst({
    where: { userId: clientUser.id },
  });

  if (!existingBooking && freeSeats.length >= 2) {
    const seatForBooking = freeSeats[0];
    const seatForGroup = freeSeats[1];

    // Mark booking seat as sold
    await prisma.seat.update({
      where: { id: seatForBooking.id },
      data: { status: SeatStatus.sold },
    });

    // Mark group seat as group_blocked and link it to the group session
    await prisma.seat.update({
      where: { id: seatForGroup.id },
      data: {
        status: SeatStatus.group_blocked,
        groupSessionId: groupSession.id,
      },
    });

    const booking = await prisma.booking.create({
      data: {
        userId: clientUser.id,
        eventId: event.id,
        totalAmount: seatForBooking.price,
        status: BookingStatus.paid,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        paidAt: new Date(),
        items: {
          create: {
            seatId: seatForBooking.id,
            priceAtBooking: seatForBooking.price,
            ticket: {
              create: {
                qrCode: `ticket-qr-${seatForBooking.id}`,
                isUsed: false,
              },
            },
          },
        },
      },
    });

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: seatForBooking.price,
        paymentMethod: PaymentMethod.card,
        status: PaymentStatus.success,
        processedAt: new Date(),
      },
    });
  } else if (groupSession && freeSeats.length >= 1) {
    // If booking already exists, but we want to make sure the group session has at least one seat blocked
    const groupSeatAssigned = await prisma.seat.findFirst({
      where: { groupSessionId: groupSession.id },
    });
    if (!groupSeatAssigned) {
      await prisma.seat.update({
        where: { id: freeSeats[0].id },
        data: {
          status: SeatStatus.group_blocked,
          groupSessionId: groupSession.id,
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log("Seed completed:", {
    adminId: adminUser.id,
    organizerId: organizerUser.id,
    clientId: clientUser.id,
    eventId: event.id,
    groupSessionId: groupSession.id,
  });
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
