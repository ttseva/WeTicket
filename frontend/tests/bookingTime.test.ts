import { formatRemainingTime } from "@shared/utils/bookingTime";

describe("formatRemainingTime", () => {
  it("returns 00:00 when expired", () => {
    const nowMs = Date.UTC(2026, 0, 1, 10, 0, 0);
    const expiresAt = new Date(nowMs - 5_000).toISOString();
    expect(formatRemainingTime(expiresAt, nowMs)).toBe("00:00");
  });

  it("formats remaining time as mm:ss", () => {
    const nowMs = Date.UTC(2026, 0, 1, 10, 0, 0);
    const expiresAt = new Date(nowMs + 65_000).toISOString();
    expect(formatRemainingTime(expiresAt, nowMs)).toBe("01:05");
  });
});
