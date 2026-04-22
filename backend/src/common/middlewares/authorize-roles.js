const { HttpError } = require("../errors/http-error");

function authorizeRoles(allowedRoles) {
  return (req, res, next) => {
    const userRole = req.auth?.role;
    if (!userRole) {
      return next(new HttpError(401, "Authentication required"));
    }

    if (!allowedRoles.includes(userRole)) {
      return next(new HttpError(403, "Insufficient permissions"));
    }

    return next();
  };
}

module.exports = { authorizeRoles };
