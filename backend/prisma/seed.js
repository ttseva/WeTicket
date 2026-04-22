const { PrismaClient, UserRole, EventCategory, EventStatus, SeatStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin12345!", 10);
  const organizerPasswordHash = await bcrypt.hash("Organizer12345!", 10);

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
      dateTime: new Date("2026-05-01T18:00:00.000Z"),
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

  // eslint-disable-next-line no-console
  console.log("Seed completed:", {
    adminId: adminUser.id,
    organizerId: organizerUser.id,
    eventId: event.id,
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
