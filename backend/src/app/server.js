const dotenv = require("dotenv");

const { createApp } = require("./app");
const { prisma } = require("../database/client");

dotenv.config();

const app = createApp();
const PORT = Number(process.env.PORT) || 8080;

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend service is running on port ${PORT}`);
});

async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}, shutting down gracefully...`);
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
