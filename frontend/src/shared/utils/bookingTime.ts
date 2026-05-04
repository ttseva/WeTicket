export function formatRemainingTime(expiresAt: string, nowMs: number = Date.now()): string {
  const leftMs = new Date(expiresAt).getTime() - nowMs;
  if (leftMs <= 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(leftMs / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
