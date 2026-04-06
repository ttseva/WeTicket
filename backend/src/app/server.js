const dotenv = require("dotenv");

const { createApp } = require("./app");

dotenv.config();

const app = createApp();
const PORT = Number(process.env.PORT) || 8080;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend service is running on port ${PORT}`);
});
