import crypto from "crypto";

export const DAILY_REPORT_PHOTO_SLOTS = [
  "front",
  "back",
  "sideDriver",
  "sidePassenger",
] as const;

export type DailyReportPhotoSlot = (typeof DAILY_REPORT_PHOTO_SLOTS)[number];

export function generateOpaqueToken(): string {
  // 32 bytes => 256 bits of entropy
  return crypto.randomBytes(32).toString("base64url");
}

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function isValidReportDateLocal(value: any): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
