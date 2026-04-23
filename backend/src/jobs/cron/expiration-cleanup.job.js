const { prisma } = require("../../database/client");

let intervalRef = null;
let isRunning = false;

async function expirePendingBookings(now) {
  const pendingBookings = await prisma.booking.findMany({
    where: {
      status: "pending",
      expiresAt: { lte: now },
    },
    include: {
      items: true,
      groupSession: true,
    },
  });

  if (pendingBookings.length === 0) {
    return { expiredBookings: 0, freedSeatsFromBookings: 0 };
  }

  const bookingIds = pendingBookings.map((booking) => booking.id);
  let freedSeatsFromBookings = 0;

  await prisma.$transaction(async (tx) => {
    for (const booking of pendingBookings) {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "expired" },
      });

      const seatIds = booking.items.map((item) => item.seatId);
      if (seatIds.length === 0) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const hasActiveGroup =
        booking.groupSession &&
        booking.groupSession.status === "active" &&
        booking.groupSession.expiresAt > now;

      if (hasActiveGroup) {
        await tx.seat.updateMany({
          where: { id: { in: seatIds }, status: "blocked" },
          data: {
            status: "group_blocked",
            groupSessionId: booking.groupSessionId,
            lockedUntil: booking.groupSession.expiresAt,
          },
        });
      } else {
        await tx.seat.updateMany({
          where: { id: { in: seatIds }, status: "blocked" },
          data: {
            status: "free",
            groupSessionId: null,
            lockedUntil: null,
          },
        });
      }
      freedSeatsFromBookings += seatIds.length;
    }
  });

  return {
    expiredBookings: bookingIds.length,
    freedSeatsFromBookings,
  };
}

async function expireGroupSessions(now) {
  const sessions = await prisma.groupSession.findMany({
    where: {
      status: "active",
      expiresAt: { lte: now },
    },
    include: {
      seats: true,
      bookings: {
        include: { items: true },
      },
    },
  });

  if (sessions.length === 0) {
    return {
      expiredSessions: 0,
      expiredGroupBookings: 0,
      freedSeatsFromGroups: 0,
    };
  }

  let expiredGroupBookings = 0;
  let freedSeatsFromGroups = 0;

  for (const session of sessions) {
    const pendingBookings = session.bookings.filter((booking) => booking.status === "pending");
    const pendingBookingIds = pendingBookings.map((booking) => booking.id);
    const pendingBookingSeatIds = pendingBookings.flatMap((booking) =>
      booking.items.map((item) => item.seatId)
    );
    const groupBlockedSeatIds = session.seats
      .filter((seat) => seat.status === "group_blocked")
      .map((seat) => seat.id);

    const seatIdsToFree = [...new Set([...pendingBookingSeatIds, ...groupBlockedSeatIds])];

    await prisma.$transaction(async (tx) => {
      await tx.groupSession.update({
        where: { id: session.id },
        data: { status: "expired" },
      });

      if (pendingBookingIds.length > 0) {
        await tx.booking.updateMany({
          where: { id: { in: pendingBookingIds }, status: "pending" },
          data: { status: "expired" },
        });
      }

      if (seatIdsToFree.length > 0) {
        await tx.seat.updateMany({
          where: { id: { in: seatIdsToFree } },
          data: {
            status: "free",
            lockedUntil: null,
            groupSessionId: null,
          },
        });
      }
    });

    expiredGroupBookings += pendingBookingIds.length;
    freedSeatsFromGroups += seatIdsToFree.length;
  }

  return {
    expiredSessions: sessions.length,
    expiredGroupBookings,
    freedSeatsFromGroups,
  };
}

async function syncGroupProgress() {
  const activeSessions = await prisma.groupSession.findMany({
    where: { status: "active" },
    select: { id: true, totalSeats: true, participantsCount: true },
  });

  let updatedSessions = 0;

  for (const session of activeSessions) {
    const paidCount = await prisma.booking.count({
      where: {
        groupSessionId: session.id,
        status: "paid",
      },
    });

    const nextStatus = paidCount >= session.totalSeats ? "completed" : "active";
    if (paidCount !== session.participantsCount || nextStatus !== "active") {
      await prisma.groupSession.update({
        where: { id: session.id },
        data: {
          participantsCount: paidCount,
          status: nextStatus,
        },
      });
      updatedSessions += 1;
    }
  }

  return { updatedSessions };
}

async function runExpirationCleanupCycle() {
  if (isRunning) {
    return;
  }

  isRunning = true;
  try {
    const now = new Date();
    const [bookingStats, groupStats, syncStats] = await Promise.all([
      expirePendingBookings(now),
      expireGroupSessions(now),
      syncGroupProgress(),
    ]);

    const hasChanges =
      bookingStats.expiredBookings > 0 ||
      groupStats.expiredSessions > 0 ||
      syncStats.updatedSessions > 0;

    if (hasChanges) {
      // eslint-disable-next-line no-console
      console.log("[expiration-job] cycle done", {
        bookingStats,
        groupStats,
        syncStats,
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[expiration-job] cycle failed", error);
  } finally {
    isRunning = false;
  }
}

function startExpirationCleanupJob() {
  const enabled = process.env.EXPIRATION_JOB_ENABLED !== "false";
  if (!enabled) {
    // eslint-disable-next-line no-console
    console.log("[expiration-job] disabled by env");
    return () => {};
  }

  const intervalMs = Number(process.env.EXPIRATION_JOB_INTERVAL_MS) || 60_000;
  runExpirationCleanupCycle();
  intervalRef = setInterval(runExpirationCleanupCycle, intervalMs);

  // eslint-disable-next-line no-console
  console.log(`[expiration-job] started with interval ${intervalMs}ms`);

  return () => {
    if (intervalRef) {
      clearInterval(intervalRef);
      intervalRef = null;
    }
  };
}

module.exports = { startExpirationCleanupJob };
