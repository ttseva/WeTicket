const { authorizeRoles } = require("../../../../src/common/middlewares/authorize-roles");

describe("authorizeRoles middleware", () => {
  test("returns 401 when req.auth is missing", () => {
    const middleware = authorizeRoles(["admin"]);
    const req = {};
    const res = {};
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  test("returns 403 when role is not allowed", () => {
    const middleware = authorizeRoles(["admin"]);
    const req = { auth: { role: "client" } };
    const res = {};
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  test("calls next without error when role is allowed", () => {
    const middleware = authorizeRoles(["admin", "organizer"]);
    const req = { auth: { role: "admin" } };
    const res = {};
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});
