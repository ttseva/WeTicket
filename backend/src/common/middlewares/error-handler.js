/**
 * Converts thrown errors into uniform HTTP responses.
 */
function errorHandler(err, req, res, next) {
  const statusCode = Number(err.statusCode) || 500;
  const payload = {
    error: statusCode >= 500 ? "InternalServerError" : "RequestError",
    message: err.message || "Unexpected server error",
  };

  if (err.details) {
    payload.details = err.details;
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json(payload);
}

module.exports = { errorHandler };
