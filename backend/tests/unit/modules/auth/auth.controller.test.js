jest.mock("../../../../src/modules/auth/auth.service", () => ({
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
}));

const authController = require("../../../../src/modules/auth/auth.controller");
const authService = require("../../../../src/modules/auth/auth.service");

function createMockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("auth.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("register returns 400 when body is missing", async () => {
    const req = {};
    const res = createMockRes();
    const next = jest.fn();

    await authController.register(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(err.message).toMatch(/json object/i);
  });

  test("register returns userId and message", async () => {
    const req = {
      body: {
        email: "u@test.ru",
        password: "User12345!",
        firstName: "Ivan",
        lastName: "Ivanov",
      },
    };
    const res = createMockRes();
    const next = jest.fn();
    authService.register.mockResolvedValue({
      user: { id: "user-1" },
    });

    await authController.register(req, res, next);

    expect(authService.register).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      userId: "user-1",
      message: "User registered successfully",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("logout works without refreshToken in body", async () => {
    const req = { auth: { userId: "user-1" } };
    const res = createMockRes();
    const next = jest.fn();
    authService.logout.mockResolvedValue(undefined);

    await authController.logout(req, res, next);

    expect(authService.logout).toHaveBeenCalledWith("user-1", undefined);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Logout successful" });
    expect(next).not.toHaveBeenCalled();
  });
});
