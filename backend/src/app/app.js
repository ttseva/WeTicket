const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const apiRoutes = require("../http/routes");
const { apiLimiter } = require("../http/middlewares/rate-limiters");
const { errorHandler } = require("../common/middlewares/error-handler");

/**
 * Creates and configures the Express application.
 * @returns {object}
 */
function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));
  // app.use(apiLimiter);

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/v1", apiRoutes);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
