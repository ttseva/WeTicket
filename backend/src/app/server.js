const dotenv = require("dotenv");

const { createApp } = require("./app");
const { prisma } = require("../database/client");
const { startExpirationCleanupJob } = require("../jobs/cron/expiration-cleanup.job");

dotenv.config();

const app = createApp();
const PORT = Number(process.env.PORT) || 8080;
const stopExpirationJob = startExpirationCleanupJob();

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend service is running on port ${PORT}`);
});

async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}, shutting down gracefully...`);
  stopExpirationJob();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});
