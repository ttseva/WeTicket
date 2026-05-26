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
      firstName: "Иван",
      lastName: "Иванов",
      phone: "+7 (999) 111-22-33",
    },
    create: {
      email: "client@weticket.ru",
      passwordHash: clientPasswordHash,
      firstName: "Иван",
      lastName: "Иванов",
      phone: "+7 (999) 111-22-33",
      role: UserRole.client,
      isVerified: true,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@weticket.ru" },
    update: {
      passwordHash: adminPasswordHash,
      firstName: "Александр",
      lastName: "Смирнов",
    },
    create: {
      email: "admin@weticket.ru",
      passwordHash: adminPasswordHash,
      firstName: "Александр",
      lastName: "Смирнов",
      role: UserRole.admin,
      isVerified: true,
      adminProfile: {
        create: {
          department: "Администрация",
        },
      },
    },
  });

  const organizerUser = await prisma.user.upsert({
    where: { email: "organizer@weticket.ru" },
    update: {
      passwordHash: organizerPasswordHash,
      firstName: "Мария",
      lastName: "Соколова",
    },
    create: {
      email: "organizer@weticket.ru",
      passwordHash: organizerPasswordHash,
      firstName: "Мария",
      lastName: "Соколова",
      role: UserRole.organizer,
      isVerified: true,
      organizerProfile: {
        create: {
          companyName: 'Концертное Агентство "Арт-Премьер"',
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
    update: {
      name: "Московский Дворец Молодежи (МДМ)",
      address: "Комсомольский проспект, 28",
      city: "Москва",
      totalRows: 5,
      seatsPerRow: 8,
    },
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Московский Дворец Молодежи (МДМ)",
      address: "Комсомольский проспект, 28",
      city: "Москва",
      totalRows: 5,
      seatsPerRow: 8,
    },
  });

  const event = await prisma.event.upsert({
    where: { id: "22222222-2222-2222-2222-222222222222" },
    update: {
      title: 'Мюзикл "Шахматы"',
      description: "Легендарный мюзикл от авторов группы ABBA. Захватывающая история о любви, предательстве и великой игре, разворачивающаяся на фоне холодного противостояния двух сверхдержав.",
      category: EventCategory.theatre,
      dateTime: new Date("2026-06-15T19:00:00.000Z"),
      duration: 150,
      venue: venue.name,
      address: venue.address,
      city: venue.city,
      minAge: 12,
      status: EventStatus.active,
    },
    create: {
      id: "22222222-2222-2222-2222-222222222222",
      organizerId: organizerUser.organizerProfile.id,
      venueId: venue.id,
      title: 'Мюзикл "Шахматы"',
      description: "Легендарный мюзикл от авторов группы ABBA. Захватывающая история о любви, предательстве и великой игре, разворачивающаяся на фоне холодного противостояния двух сверхдержав.",
      category: EventCategory.theatre,
      dateTime: new Date("2026-06-15T19:00:00.000Z"),
      duration: 150,
      venue: venue.name,
      address: venue.address,
      city: venue.city,
      minAge: 12,
      status: EventStatus.active,
    },
  });

  const venue2 = await prisma.venue.upsert({
    where: { id: "55555555-5555-5555-5555-555555555555" },
    update: {
      name: "Crocus City Hall",
      address: "МКАД, 66-й километр, к1",
      city: "Красногорск",
      totalRows: 6,
      seatsPerRow: 10,
    },
    create: {
      id: "55555555-5555-5555-5555-555555555555",
      name: "Crocus City Hall",
      address: "МКАД, 66-й километр, к1",
      city: "Красногорск",
      totalRows: 6,
      seatsPerRow: 10,
    },
  });

  const event2 = await prisma.event.upsert({
    where: { id: "44444444-4444-4444-4444-444444444444" },
    update: {
      title: 'Рок-концерт группы "Звери"',
      description: "Большой сольный концерт легендарной рок-группы «Звери» с программой «Все хиты». Вас ждут живой звук, потрясающее световое шоу и все любимые песни от «Районы-кварталы» до «До скорой встречи»!",
      category: EventCategory.concert,
      dateTime: new Date("2026-06-12T19:00:00.000Z"),
      duration: 120,
      venue: venue2.name,
      address: venue2.address,
      city: venue2.city,
      minAge: 16,
      status: EventStatus.active,
    },
    create: {
      id: "44444444-4444-4444-4444-444444444444",
      organizerId: organizerUser.organizerProfile.id,
      venueId: venue2.id,
      title: 'Рок-концерт группы "Звери"',
      description: "Большой сольный концерт легендарной рок-группы «Звери» с программой «Все хиты». Вас ждут живой звук, потрясающее световое шоу и все любимые песни от «Районы-кварталы» до «До скорой встречи»!",
      category: EventCategory.concert,
      dateTime: new Date("2026-06-12T19:00:00.000Z"),
      duration: 120,
      venue: venue2.name,
      address: venue2.address,
      city: venue2.city,
      minAge: 16,
      status: EventStatus.active,
    },
  });

  const venue3 = await prisma.venue.upsert({
    where: { id: "77777777-7777-7777-7777-777777777777" },
    update: {
      name: "Технопарк \"Сколково\"",
      address: "Большой бульвар, 42, стр. 1",
      city: "Москва",
      totalRows: 4,
      seatsPerRow: 8,
    },
    create: {
      id: "77777777-7777-7777-7777-777777777777",
      name: "Технопарк \"Сколково\"",
      address: "Большой бульвар, 42, стр. 1",
      city: "Москва",
      totalRows: 4,
      seatsPerRow: 8,
    },
  });

  const event3 = await prisma.event.upsert({
    where: { id: "66666666-6666-6666-6666-666666666666" },
    update: {
      title: "Российский Интернет Форум (РИФ 2026)",
      description: "Главное весеннее событие рунета. Тренды IT-индустрии, обсуждение цифровой экономики, искусственного интеллекта, стартапов и маркетинга. Выступления ведущих экспертов отрасли.",
      category: EventCategory.conference,
      dateTime: new Date("2026-07-28T09:00:00.000Z"),
      duration: 480,
      venue: venue3.name,
      address: venue3.address,
      city: venue3.city,
      minAge: 18,
      status: EventStatus.active,
    },
    create: {
      id: "66666666-6666-6666-6666-666666666666",
      organizerId: organizerUser.organizerProfile.id,
      venueId: venue3.id,
      title: "Российский Интернет Форум (РИФ 2026)",
      description: "Главное весеннее событие рунета. Тренды IT-индустрии, обсуждение цифровой экономики, искусственного интеллекта, стартапов и маркетинга. Выступления ведущих экспертов отрасли.",
      category: EventCategory.conference,
      dateTime: new Date("2026-07-28T09:00:00.000Z"),
      duration: 480,
      venue: venue3.name,
      address: venue3.address,
      city: venue3.city,
      minAge: 18,
      status: EventStatus.active,
    },
  });

  const venue4 = await prisma.venue.upsert({
    where: { id: "99999999-9999-9999-9999-999999999999" },
    update: {
      name: "Каро 11 Октябрь",
      address: "ул. Новый Арбат, 24",
      city: "Москва",
      totalRows: 5,
      seatsPerRow: 12,
    },
    create: {
      id: "99999999-9999-9999-9999-999999999999",
      name: "Каро 11 Октябрь",
      address: "ул. Новый Арбат, 24",
      city: "Москва",
      totalRows: 5,
      seatsPerRow: 12,
    },
  });

  const event4 = await prisma.event.upsert({
    where: { id: "88888888-8888-8888-8888-888888888888" },
    update: {
      title: "Кинопоказ \"Мастер и Маргарита\"",
      description: "Специальный показ новой экранизации великого романа Михаила Булгакова. Обсуждение фильма с режиссером и известными кинокритиками после сеанса.",
      category: EventCategory.cinema,
      dateTime: new Date("2026-06-05T20:00:00.000Z"),
      duration: 160,
      venue: venue4.name,
      address: venue4.address,
      city: venue4.city,
      minAge: 18,
      status: EventStatus.active,
    },
    create: {
      id: "88888888-8888-8888-8888-888888888888",
      organizerId: organizerUser.organizerProfile.id,
      venueId: venue4.id,
      title: "Кинопоказ \"Мастер и Маргарита\"",
      description: "Специальный показ новой экранизации великого романа Михаила Булгакова. Обсуждение фильма с режиссером и известными кинокритиками после сеанса.",
      category: EventCategory.cinema,
      dateTime: new Date("2026-06-05T20:00:00.000Z"),
      duration: 160,
      venue: venue4.name,
      address: venue4.address,
      city: venue4.city,
      minAge: 18,
      status: EventStatus.active,
    },
  });

  const existingSeats = await prisma.seat.count({
    where: { eventId: event.id },
  });

  if (existingSeats === 0) {
    const seats = [];
    for (let row = 1; row <= venue.totalRows; row += 1) {
      for (let seat = 1; seat <= venue.seatsPerRow; seat += 1) {
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

  const existingSeats2 = await prisma.seat.count({
    where: { eventId: event2.id },
  });

  if (existingSeats2 === 0) {
    const seats2 = [];
    for (let row = 1; row <= venue2.totalRows; row += 1) {
      for (let seat = 1; seat <= venue2.seatsPerRow; seat += 1) {
        seats2.push({
          eventId: event2.id,
          rowNumber: row,
          seatNumber: seat,
          price: row <= 2 ? 5000 : (row <= 4 ? 3500 : 2000),
          status: SeatStatus.free,
        });
      }
    }
    await prisma.seat.createMany({ data: seats2 });
  }

  const existingSeats3 = await prisma.seat.count({
    where: { eventId: event3.id },
  });

  if (existingSeats3 === 0) {
    const seats3 = [];
    for (let row = 1; row <= venue3.totalRows; row += 1) {
      for (let seat = 1; seat <= venue3.seatsPerRow; seat += 1) {
        seats3.push({
          eventId: event3.id,
          rowNumber: row,
          seatNumber: seat,
          price: row <= 1 ? 15000 : 8000,
          status: SeatStatus.free,
        });
      }
    }
    await prisma.seat.createMany({ data: seats3 });
  }

  const existingSeats4 = await prisma.seat.count({
    where: { eventId: event4.id },
  });

  if (existingSeats4 === 0) {
    const seats4 = [];
    for (let row = 1; row <= venue4.totalRows; row += 1) {
      for (let seat = 1; seat <= venue4.seatsPerRow; seat += 1) {
        seats4.push({
          eventId: event4.id,
          rowNumber: row,
          seatNumber: seat,
          price: row <= 2 ? 800 : 500,
          status: SeatStatus.free,
        });
      }
    }
    await prisma.seat.createMany({ data: seats4 });
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
    event2Id: event2.id,
    event3Id: event3.id,
    event4Id: event4.id,
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
