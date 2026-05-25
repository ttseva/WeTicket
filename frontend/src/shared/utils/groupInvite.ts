export function buildGroupInviteUrl(inviteLink: string): string {
  if (typeof window === "undefined") {
    return `/groups/join/${inviteLink}`;
  }
  return `${window.location.origin}/groups/join/${inviteLink}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export const GROUP_SEAT_MIN = 3;
export const GROUP_SEAT_MAX = 20;
